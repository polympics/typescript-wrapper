/** Utility for getting paginated responses from the API. */
import { PaginatedResponse } from './types';

/** Utility for getting paginated responses from the API. */
export class Paginator<Type> {
    lastPage: number;
    nextPageDone: boolean;

    constructor(
        public getPage: (params: Record<string, any>)
            => Promise<PaginatedResponse<Type>>
    ) {
        this.lastPage = 0;
        this.nextPageDone = false;
    }

    /** Utility to get the next page.
     *
     * Note that calls to getPage will not change the next page that this
     * gets. Once all pages have been gotten, this will return an empty
     * array (but won't invoke the API).
     */
    async nextPage(): Promise<Type[]> {
        const response = await this.getPage({ page: this.lastPage });
        this.lastPage += 1;
        return response.data;
    }
}
