/** Utility for making HTTP requests to the API. */
import {
    Credentials,
    ServerError,
    DataError,
    ClientError
} from './types';


/** HTTP verbs used by the API.
 *
 * (There are other methods but the API doesn't use them.)
 */
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** Fetch arguments (only the ones we need). */
interface FetchOptions {
    method?: string,
    body?: string,
    headers?: Record<string, string>
}

/** Base class for clients. */
export class BaseClient {
    apiUrl: string;
    credentials?: Credentials;

    constructor({
        apiUrl = 'http://127.0.0.1:8000',
        credentials = null
    } = {}) {
        this.apiUrl = apiUrl;
        this.credentials = credentials;
    }

    /** Handle a response from the API, raising possible errors. */
    async handleResponse<Type>(response: Response): Promise<Type> {
        switch (response.status) {
            case 500:
                throw new ServerError(500);
            case 204:
                return null
        }
        const data = await response.json();
        if (response.status < 400) {
            return data;
        }
        if (response.status === 422) {
            throw new DataError(422, data);
        }
        throw new ClientError(response.status, data.detail);
    }

    /** Make a request to an API endpoint. */
    async makeRequest<Type>(
        method: HttpMethod,
        endpoint: string,
        data: Record<string, any> = {}
    ): Promise<Type> {
        let fetchOptions: FetchOptions = {
            method: method,
            headers: {}
        }
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
        return await this.handleResponse<Type>(response);
    }
}
