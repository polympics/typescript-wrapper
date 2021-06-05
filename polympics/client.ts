/** Utility for making HTTP requests to the API. */
import {
    Credentials,
    ServerError,
    DataError,
    ClientError,
    EmptyResponse
} from './types';

/** Fetch arguments (only the ones we need). */
interface FetchOptions {
    method: string,
    headers: Record<string, string>,
    body?: string,
}

/** HTTP verbs used by the API.
 *
 * (There are other methods but the API doesn't use them.)
 */
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

/** Base class for clients. */
export class BaseClient {
    apiUrl: string;
    credentials?: Credentials | null;

    constructor({
        apiUrl = 'https://api.polytopia.fun',
        credentials = null
    }: { apiUrl?: string, credentials?: Credentials | null } = {}) {
        this.apiUrl = apiUrl;
        this.credentials = credentials;
    }

    /** Handle a response from the API, raising possible errors. */
    private async handleResponse<Type>(
        response: Response, emptyResponse: boolean = false
    ): Promise<Type> {
        if (response.status >= 500) {
            throw new ServerError(response.status);
        }
        if (response.status < 400) {
            // @ts-ignore: We know it's fine to return null because the
            //             emptyResponse flag was passed.
            if (emptyResponse) { return null }
            else { return await response.json() }
        }
        const error = (await response.json()).detail;
        if (response.status === 422) {
            throw new DataError(422, error);
        }
        throw new ClientError(response.status, error);
    }

    /** Make a request to an API endpoint. */
    protected async request<Type>(
        method: HttpMethod,
        endpoint: string,
        data: Record<string, any> = {},
        { emptyResponse = false }: { emptyResponse?: boolean } = {}
    ): Promise<Type> {
        let url = this.apiUrl + endpoint;
        const fetchOptions: FetchOptions = {
            method: method,
            headers: {}
        }
        if (method === 'GET') {
            // Body-less method, put data in URL params.
            const params = new URLSearchParams(data);
            url += `?${params.toString()}`;
        } else {
            // Body-full method, put data in JSON body.
            fetchOptions.body = JSON.stringify(data);
            fetchOptions.headers['Content-Type'] = 'application/json';
        }
        if (this.credentials) {
            fetchOptions.headers['Authorization'] = 'Basic ' + btoa(
                `${this.credentials.username}:${this.credentials.password}`
            );
        }
        const response = await fetch(url, fetchOptions);
        return await this.handleResponse<Type>(response, emptyResponse);
    }
}
