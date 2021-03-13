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
    discordId: string;
    displayName: string;
    discriminator: number;
    permissions: number;
    avatarUrl: string;
    team: Team;
}

export interface TeamUpdate {
    name: string;
}

export interface AccountUpdate {
    displayName?: string;
    discriminator?: number;
    grantPermissions?: number;
    revokePermissions?: number;
    avatarUrl?: string;
    team?: Team;
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
    async getAccount(discordId: string): Promise<Account> {
        const data = await this.request<RawAccount>(
            'GET', `/account/${discordId}`
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
            if (search) {
                params.q = search;
            }
            if (team) {
                params.team = team.id;
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
            if (search) {
                params.q = search;
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
            'POST', '/accounts/signup', {
                discord_id: account.discordId,
                display_name: account.displayName,
                discriminator: account.discriminator,
                avatar_url: account.avatarUrl,
                team: account.team.id,
                permissions: account.permissions
            }
        );
        return new Account(data);
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
        if (options.displayName) {
            data.display_name = options.displayName;
        }
        if (options.grantPermissions) {
            data.grant_permissions = options.grantPermissions;
        }
        if (options.revokePermissions) {
            data.revoke_permissions = options.revokePermissions;
        }
        if (options.team) {
            data.team = options.team.id;
        }
        const newData = await this.request<RawAccount>(
            'PATCH', `/account/${account.discordId}`, data
        );
        return new Account(newData);
    }

    /** Delete an account. */
    async deleteAccount(account: Account) {
        await this.request<null>(
            'DELETE', `/account/${account.discordId}`, {},
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
            'POST', `/account/${account.discordId}/session`
        );
        return new Session(data);
    }

    /** Reset the authenticated app's token. */
    async resetToken(): Promise<AppCredentials> {
        const data = await this.request<RawAppCredentials>(
            'POST', '/app/reset_token'
        );
        const app = new AppCredentials(data);
        this.credentials = app;
        return app;
    }

    /** Get metadata on the authenticated app. */
    async getApp(): Promise<App> {
        const data =  await this.request<RawApp>('GET', '/app');
        return new App(data);
    }
}

/** Wrappers for endpoints that require user authentication. */
export class UserClient extends AuthenticatedClient {
    /** Get the account for the authenticated user. */
    async getSelf(): Promise<Account> {
        const data = await this.request<RawAccount>('GET', '/accounts/me');
        return new Account(data);
    }
}
