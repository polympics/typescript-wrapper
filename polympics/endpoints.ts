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

export interface NewAccount {
    discordId: bigint;
    displayName: string;
    discriminator: number;
    permissions: number;
    avatarUrl: string;
    team: Team;
}

/** Wrappers for endpoints that don't need authentication. */
export class UnauthenticatedClient extends BaseClient {
    /** Get an account by Discord ID. */
    async getAccount(discordId: bigint): Promise<Account> {
        const data = await this.makeRequest<RawAccount>(
            'GET', `/account/${discordId}`
        );
        return new Account(data);
    }

    /** Get a team by ID. */
    async getTeam(id: number): Promise<Team> {
        const data = await this.makeRequest<RawTeam>('GET', `/team/${id}`);
        return new Team(data);
    }

    /** Get a paginated list of accounts matching a query. */
    listAccounts({ search = null, team = null} = {}): Paginator<Account> {
        const thisClient = this;
        async function getPage(
                params: Record<string, any>
        ): Promise<PaginatedResponse<Account>> {
            if (search) {
                params.search = search;
            }
            if (team) {
                params.team = team.id;
            }
            const data = await thisClient.makeRequest<
                    RawPaginatedResponse<Account>
            >(
                'GET', '/accounts/search', params
            );
            return new PaginatedResponse<Account>(data);
        }
        return new Paginator<Account>(getPage);
    }

    /** Get a paginated list of teams matching a query. */
    listTeams({ search = null }): Paginator<Team> {
        const thisClient = this;
        async function getPage(
                params: Record<string, any>
        ): Promise<PaginatedResponse<Team>> {
            if (search) {
                params.search = search;
            }
            const data = await thisClient.makeRequest<
                    RawPaginatedResponse<Team>
            >(
                'GET', '/teams/search', params
            );
            return new PaginatedResponse<Team>(data);
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
        const data = await this.makeRequest<RawAccount>(
            'POST', '/accounts/new', {
                discord_id: account.discordId,
                display_name: account.displayName,
                discriminator: account.discriminator,
                avatar_url: account.avatarUrl,
                team: account.team.id
            }
        );
        return new Account(data);
    }

    /** Update an edited account.
     *
     * Example:
     * ```ts
     * account = await client.getAccount(1241481984);
     * account.displayName = 'New name';
     * await client.updateAccount(account);
     * ```
     *
     * Note that modifications to `createdAt` will be ignored, and
     * modifications to `discordId` will not act as expected.
     */
    async updateAccount(account: Account) {
        await this.makeRequest<null>(
            'PATCH', `/account/${account.discordId}`, account.toRaw()
        );
    }

    /** Delete an account. */
    async deleteAccount(account: Account) {
        await this.makeRequest<null>(
            'DELETE', `/account/${account.discordId}`
        );
    }

    /** Create a new team. */
    async createTeam(name: string): Promise<Team> {
        return await this.makeRequest<Team>('POST', '/teams/new', {
            name: name
        });
    }

    /** Edit a team's name. */
    async updateTeam(team: Team, newName: string) {
        await this.makeRequest<null>(
            'PATCH', `/team/${team.id}`, { name: newName }
        );
        team.name = newName;
    }

    /** Delete a team. */
    async deleteTeam(team: Team) {
        await this.makeRequest<null>('DELETE', `/team/${team.id}`);
    }
}

/** Wrappers for endpoints that require app authentication. */
export class AppClient extends AuthenticatedClient {
    /** Create a user authentication session. */
    async createSession(account: Account): Promise<Session> {
        const data = await this.makeRequest<RawSession>(
            'POST', `/account/${account.discordId}/session`
        );
        return new Session(data);
    }

    /** Reset the authenticated app's token. */
    async resetToken(): Promise<AppCredentials> {
        const data = await this.makeRequest<RawAppCredentials>(
            'POST', '/app/reset_token'
        );
        const app = new AppCredentials(data);
        this.credentials = app;
        return app;
    }

    /** Get metadata on the authenticated app. */
    async getApp(): Promise<App> {
        const data =  await this.makeRequest<RawApp>('GET', '/app');
        return new App(data);
    }
}

/** Wrappers for endpoints that require user authentication. */
export class UserClient extends AuthenticatedClient {
    /** Get the account for the authenticated user. */
    async getSelf(): Promise<Account> {
        const data = await this.makeRequest<RawAccount>('GET', '/accounts/me');
        return new Account(data);
    }
}
