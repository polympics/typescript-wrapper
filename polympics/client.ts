/** Utility for making HTTP requests to the API. */
import {
    Credentials,
    ServerError,
    DataError,
    ClientError,
    EmptyResponse
} from './types';


/** HTTP verbs used by the API.
 *
 * (There are other methods but the API doesn't use them.)
 */
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** Fetch arguments (only the ones we need). */
interface FetchOptions {
    method: string,
    headers: Record<string, string>,
    body?: string,
}

/** Base class for clients. */
export class BaseClient {
    apiUrl: string;
    credentials?: Credentials | null;

    constructor({
        apiUrl = 'http://127.0.0.1:8000',
        credentials = null
    } = {}) {
        this.apiUrl = apiUrl;
        this.credentials = credentials;
    }

    /** Handle a response from the API, raising possible errors. */
    private async handleResponse<Type>(response: Response): Promise<Type> {
        switch (response.status) {
            case 500:
                throw new ServerError(500);
            case 204:
                throw new EmptyResponse(204);
        }
        const data = await response.json();
        if (response.status < 400) {
            return data;
        }
        if (response.status === 422) {
            throw new DataError(422, data.detail);
        }
        throw new ClientError(response.status, data.detail);
    }

    /** Make a request to an API endpoint. */
    protected async request<Type>(
        method: HttpMethod,
        endpoint: string,
        data: Record<string, any> = {},
        { allowNullResponse = false } = {}
    ): Promise<Type> {
        let fetchOptions: FetchOptions = {
            method: method,
            headers: {}
        }
        endpoint = this.apiUrl + endpoint;
        if (method === 'GET') {
            // Body-less method, put data in URL params.
            const params = new URLSearchParams(data);
            endpoint += `?${params.toString()}`;
        } else {
            // Body-full method, put data in JSON body.
            fetchOptions.body = JSON.stringify(data);
            fetchOptions.headers['Content-Type'] = 'application/json';
        }
        if (this.credentials) {
            const encodedAuth = btoa(
                `${this.credentials.username}:${this.credentials.password}`
            );
            const authHeader = `Basic ${encodedAuth}`;
            fetchOptions.headers['Authorization'] = authHeader;
        }
        const response = await fetch(endpoint, fetchOptions);
        try {
            return await this.handleResponse<Type>(response);
        } catch(error) {
            if (allowNullResponse && (error.code === 204)) {
                // @ts-ignore: We know it's fine to return null because the
                //             allowNullResponse flag was passed.
                return null;
            } else {
                throw error;
            }
        }
    }
}
