/** Utility for making HTTP requests to the API. */
import {
    Credentials,
    ServerError,
    DataError,
    ClientError,
    EmptyResponse
} from './types';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';


/** HTTP verbs used by the API.
 *
 * (There are other methods but the API doesn't use them.)
 */
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

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
    private async handleResponse<Type>(response: AxiosResponse): Promise<Type> {
        switch (response.status) {
            case 500:
                throw new ServerError(500);
            case 204:
                throw new EmptyResponse(204);
        }
        const data = await response.data;
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
        let axiosOptions: AxiosRequestConfig = {
            baseURL: this.apiUrl,
            url: endpoint,
            method: method,
            headers: {},
            // We'll handle bad status codes ourselves, later.
            validateStatus: () => true
        }
        if (method === 'GET') {
            // Body-less method, put data in URL params.
            axiosOptions.params = data;
        } else {
            // Body-full method, put data in JSON body.
            axiosOptions.data = data;
            axiosOptions.headers['Content-Type'] = 'application/json';
        }
        if (this.credentials) {
            axiosOptions.auth = {
                username: this.credentials.username,
                password: this.credentials.password
            }
        }
        const response = await axios(axiosOptions);
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
