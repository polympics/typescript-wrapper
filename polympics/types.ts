/** The types returned by the API. */

/** Bit flags for permissions. */
export enum PolympicsPermissions {
    managePermissions = 1 << 0,
    manageAccountTeams = 1 << 1,
    manageAccountDetails = 1 << 2,
    manageTeams = 1 << 3,
    authenticateUsers = 1 << 4,
    manageOwnTeam = 1 << 5
}

/** Team object as returned by the API. */
export interface RawTeam {
    id: number,
    name: string,
    created_at: number,
    member_count: number
}

/** Team object as used by the wrapper. */
export class Team {
    id: number;
    name: string;
    createdAt: Date;
    memberCount: number;

    constructor({ id, name, created_at, member_count }: RawTeam) {
        this.id = id;
        this.name = name;
        this.createdAt = new Date(created_at * 1000);
        this.memberCount = member_count;
    }

    /** Convert the team to data suitable to passed to the API. */
    toRaw(): RawTeam {
        return {
            id: this.id,
            name: this.name,
            created_at: this.createdAt.getTime() / 1000,
            member_count: this.memberCount
        }
    }
}

/** User account object as returned by the API. */
export interface RawAccount {
    discord_id: bigint,
    display_name: string,
    discriminator: number,
    created_at: number,
    permissions: number,
    avatar_url: string,
    team: RawTeam
}

/** User account object as used by the wrapper. */
export class Account {
    discordId: bigint;
    displayName: string;
    discriminator: number;
    createdAt: Date;
    permissions: number;
    avatarUrl: string;
    team: Team;

    constructor({
            discord_id, display_name, discriminator, created_at,
            permissions, avatar_url, team
    }: RawAccount) {
        this.discordId = discord_id;
        this.displayName = display_name;
        this.discriminator = discriminator;
        this.createdAt = new Date(created_at * 1000);
        this.permissions = permissions;
        this.avatarUrl = avatar_url;
        this.team = new Team(team);
    }

    /** Convert the account to data suitable to passed to the API. */
    toRaw(): Record<string, any> {
        return {
            discord_id: this.discordId,
            display_name: this.displayName,
            discriminator: this.discriminator,
            created_at: this.createdAt.getTime() / 1000,
            avatar_url: this.avatarUrl,
            team: this.team.id
        }
    }
}

/** One page of a paginated response from the API. */
export interface RawPaginatedResponse<Type> {
    page: number,
    per_page: number,
    pages: number,
    results: number,
    data: Type[]
}

/** One page of a paginated response from the API. */
export class PaginatedResponse<Type> {
    page: number;
    perPage: number;
    pages: number;
    results: number;
    data: Type[];

    constructor(
        { page, per_page, pages, results, data }: RawPaginatedResponse<Type>
    ) {
        this.page = page;
        this.perPage = per_page;
        this.pages = pages;
        this.results = results;
        this.data = data;
    }
}

/** An object that can be used to authenticate to the API. */
export interface Credentials {
    username: string,
    password: string
}

/** A user authentication session. */
export interface RawSession extends Credentials {
    expires_at: number
}

/** A user authentication session. */
export class Session implements Credentials {
    username: string;
    password: string;
    expiresAt: Date;

    constructor({ username, password, expires_at }: RawSession) {
        this.username = username;
        this.password = password;
        this.expiresAt = new Date(expires_at * 1000);
    }
}

/** Metadata on an API app. */
export interface RawApp {
    username: string,
    display_name: string
}

/** Metadata on an API app. */
export class App {
    username: string;
    displayName: string;

    constructor({ username, display_name }: RawApp) {
        this.username = username;
        this.displayName = display_name;
    }
}

/** Metadata and credentials for an API app. */
export type RawAppCredentials = Credentials & RawApp;

/** Metadata and credentials for an API app. */
export class AppCredentials extends App implements Credentials {
    password: string;

    constructor({ username, password, display_name }: RawAppCredentials) {
        super({ username: username, display_name: display_name });
        this.password = password;
    }
}

/** Any response from the API with status code >= 400. */
export class PolympicsError extends Error {
    constructor(public code: number) {
        super(`Polympics error: ${code}.`);
    }
}

/** An error on the server side. */
export class ServerError extends PolympicsError {};

/** Details about a parameter error returned from the server. */
interface ParameterError {
    loc: string[],
    msg: string,
    type: string
}

/** An error in the data passed to the server. */
export class DataError extends PolympicsError {
    constructor(code: number, public issues: ParameterError[]) {
        super(code);
        let lines: string[] = [`${code}: ${issues.length} parameter errors:\n`];
        for (const issue of issues) {
            const path = issue.loc.join(' -> ');
            lines.push(`  ${path}: ${issue.msg} (${issue.type})`);
        }
        this.message = lines.join('\n');
    }
};

/** A different client-resolvable error. */
export class ClientError extends PolympicsError {
    constructor(code: number, public detail: string) {
        super(code);
        this.message = `${code}: ${detail}`;
    }
}
