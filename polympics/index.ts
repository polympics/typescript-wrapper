/** A wrapper for the Polympics API, in TypeScript. */
export {
    UserClient,
    AppClient,
    UnauthenticatedClient,
    NewTeam,
    NewAccount,
    NewAward,
    TeamUpdate,
    AccountUpdate,
    AwardUpdate,
    SearchOptions,
    AccountSearchOptions
} from './endpoints';
export { Paginator } from './paginator';
export { BaseClient } from './client';
export {
    PolympicsPermissions,
    Team,
    Account,
    Award,
    ExtendedAward,
    PaginatedResponse,
    Credentials,
    Session,
    App,
    AppCredentials,
    PolympicsError,
    ServerError,
    ParameterError,
    DataError,
    ClientError,
    EmptyResponse
} from './types';
