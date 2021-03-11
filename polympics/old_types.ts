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
export interface Team {
    id: number,
    name: string,
    createdAt: Date,
    memberCount: number
}

/** User account object as returned by the API. */
export interface Account {
    discordId: bigint,
    displayName: string,
    discriminator: number,
    createdAt?: Date,
    permissions: number,
    avatarUrl: string,
    team?: Team
}

/** One page of a paginated response from the API. */
export interface PaginatedResponse<Type> {
    page: number,
    perPage: number,
    pages: number,
    results: number,
    data: Type[]
}

/** An object that can be used to authenticate to the API. */
export interface Credentials {
    username: string,
    password: string
}

/** A user authentication session. */
export interface Session extends Credentials {
    expiresAt: Date
}

/** Metadata on an API app. */
export interface App {
    username: string,
    displayName: string
}

/** Metadata and credentials for an API app. */
export type AppCredentials = Credentials & App;

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
