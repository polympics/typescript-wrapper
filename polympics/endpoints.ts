/** Clients to make requests to the various API endpoints. */
import { BaseClient } from './client';
import {
    RawTeam, Team,
    RawAccount, Account,
    RawPaginatedResponse, PaginatedResponse,
    RawSession, Session,
    RawApp, App,
    RawAppCredentials, AppCredentials
} from './types';
import { Paginator } from './paginator';

export interface NewTeam {
    name: string;
}

export interface NewAccount {
    id: string;
    name: string;
    discriminator: string;
    avatarUrl: string;
    permissions?: number;
    team?: Team | null;
}

export interface TeamUpdate {
    name: string;
}

export interface AccountUpdate {
    name?: string;
    discriminator?: string;
    grantPermissions?: number;
    revokePermissions?: number;
    avatarUrl?: string;
    team?: Team | null;
    discordToken?: string;
}

export interface SearchOptions {
    search?: string | null;
}

export interface AccountSearchOptions extends SearchOptions {
    team?: Team | null;
}

/** Wrappers for endpoints that don't need authentication. */
export class UnauthenticatedClient extends BaseClient {
    /** Get an account by Discord ID. */
    async getAccount(id: string): Promise<Account> {
        const data = await this.request<RawAccount>(
            'GET', `/account/${id}`
        );
        return new Account(data);
    }

    /** Get a team by ID. */
    async getTeam(id: number): Promise<Team> {
        const data = await this.request<RawTeam>('GET', `/team/${id}`);
        return new Team(data);
    }

    /** Get a paginated list of accounts matching a query. */
    listAccounts(
            { search = null, team = null}: AccountSearchOptions = {}
    ): Paginator<Account> {
        const thisClient = this;
        async function getPage(
                params: Record<string, any>
        ): Promise<PaginatedResponse<Account>> {
            if (search) params.q = search;
            if (team) params.team = team.id;
            if (params.perPage) {
                params.per_page = params.perPage;
                delete params.perPage;
            }
            const data = await thisClient.request<
                    RawPaginatedResponse<RawAccount>
            >(
                'GET', '/accounts/search', params
            );
            const parsedData = [];
            for (const raw of data.data) {
                parsedData.push(new Account(raw));
            }
            return new PaginatedResponse<Account>(data, parsedData);
        }
        return new Paginator<Account>(getPage);
    }

    /** Get a paginated list of teams matching a query. */
    listTeams({ search = null }: SearchOptions = {}): Paginator<Team> {
        const thisClient = this;
        async function getPage(
                params: Record<string, any>
        ): Promise<PaginatedResponse<Team>> {
            if (search) params.q = search;
            if (params.perPage) {
                params.per_page = params.perPage;
                delete params.perPage;
            }
            const data = await thisClient.request<
                    RawPaginatedResponse<RawTeam>
            >(
                'GET', '/teams/search', params
            );
            const parsedData = [];
            for (const raw of data.data) {
                parsedData.push(new Team(raw));
            }
            return new PaginatedResponse<Team>(data, parsedData);
        }
        return new Paginator<Team>(getPage);
    }

    /** Create a session from a Discord user token */
    async discordAuthenticate(token: string): Promise<Session> {
        return await this.request<Session>('POST', '/auth/discord', {
            'token': token
        });
    }

    /** Edit an account. */
    async updateAccount(
            account: Account, options: AccountUpdate
    ): Promise<Account> {
        const data: Record<string, any> = {};
        if (options.avatarUrl) {
            data.avatar_url = options.avatarUrl;
        }
        if (options.discriminator) {
            data.discriminator = options.discriminator;
        }
        if (options.name) {
            data.name = options.name;
        }
        if (options.grantPermissions) {
            data.grant_permissions = options.grantPermissions;
        }
        if (options.revokePermissions) {
            data.revoke_permissions = options.revokePermissions;
        }
        if (options.team !== undefined) {
            data.team = options.team ? options.team.id : 0;
        }
        if (options.discordToken) {
            data.discord_token = options.discordToken;
        }
        const newData = await this.request<RawAccount>(
            'PATCH', `/account/${account.id}`, data
        );
        return new Account(newData);
    }
}

/** Wrappers for endpoints that require app *or* user authentication. */
class AuthenticatedClient extends UnauthenticatedClient {
    /** Create a new account.
     *
     * Note that although it accepts an Account object, the createdAt
     * attribute will be ignored if set.
     */
    async createAccount(account: NewAccount): Promise<Account> {
        const data = await this.request<RawAccount>(
            'POST', '/accounts/new', {
                id: account.id,
                name: account.name,
                discriminator: account.discriminator,
                avatar_url: account.avatarUrl,
                team: account.team ? account.team.id : null,
                permissions: account.permissions || 0
            }
        );
        return new Account(data);
    }

    /** Delete an account. */
    async deleteAccount(account: Account) {
        await this.request<null>(
            'DELETE', `/account/${account.id}`, {},
            { allowNullResponse: true }
        );
    }

    /** Create a new team. */
    async createTeam(name: string): Promise<Team> {
        return await this.request<Team>('POST', '/teams/new', {
            name: name
        });
    }

    /** Edit a team's name. */
    async updateTeam(team: Team, options: TeamUpdate): Promise<Team> {
        const data = await this.request<RawTeam>(
            'PATCH', `/team/${team.id}`, options
        );
        return new Team(data);
    }

    /** Delete a team. */
    async deleteTeam(team: Team) {
        await this.request<null>(
            'DELETE', `/team/${team.id}`, {}, { allowNullResponse: true }
        );
    }
}

/** Wrappers for endpoints that require app authentication. */
export class AppClient extends AuthenticatedClient {
    /** Create a user authentication session. */
    async createSession(account: Account): Promise<Session> {
        const data = await this.request<RawSession>(
            'POST', `/auth/create_session`, { account: account.id }
        );
        return new Session(data);
    }

    /** Reset the authenticated app's token. */
    async resetToken(): Promise<AppCredentials> {
        const data = await this.request<RawAppCredentials>(
            'POST', '/auth/reset_token'
        );
        const app = new AppCredentials(data);
        this.credentials = app;
        return app;
    }

    /** Get metadata on the authenticated app. */
    async getSelf(): Promise<App> {
        const data =  await this.request<RawApp>('GET', '/auth/me');
        return new App(data);
    }
}

/** Wrappers for endpoints that require user authentication. */
export class UserClient extends AuthenticatedClient {
    /** Reset the session's token. */
    async resetToken(): Promise<Session> {
        const data = await this.request<RawSession>(
            'POST', '/auth/reset_token'
        );
        const app = new Session(data);
        this.credentials = app;
        return app;
    }

    /** Get the account for the authenticated user. */
    async getSelf(): Promise<Account> {
        const data = await this.request<RawAccount>('GET', '/auth/me');
        return new Account(data);
    }
}
