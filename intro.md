## Intro

### Creating a client

The first thing you need to do to use the API is create an API client. There are 3 types of client:

- Unauthenticated
- App-authenticated
- User-authenticated

Creating an unauthenticated client is very simple:
```js
const client = polympics.UnauthenticatedClient();
```
However, if you want to do anything other than read-only operations, you’ll need to authenticate. To use app credentials, see the following example:
```js
const credentials = { username: 'A3', password: 'YOUR-TOKEN-HERE'};
const client = polympics.AppClient({ credentials: credentials });
```
Creating a user-authenticated client is very similar:
```js
const credentials = Credentials('S4', 'YOUR-TOKEN-HERE');
const client = polympics.UserClient({ credentials: credentials });
```
All three clients take an additional parameter, `apiUrl`. This is location at which the API is hosted, for example `http://127.0.0.1:8000` or `https://api.polytopia.fun`.

### Getting an account

You can get an account by Discord ID using `getAccount`. For example:
```js
const account = await client.getAccount('12345678901234');
console.log(account.name);
console.log(account.permissions);
console.log(account.team.name);
```
Note that Discord IDs are strings, because they require more precision than JavaScript's default numeric type has.

### Getting a team

You can get a team by ID using `getTeam`. For example:
```js
const team = await client.getTeam(31);
console.log(team.name);
console.log(team.memberCount);
```

### Getting an award

You can get an award by ID using ``getAward``. For example:

```js
const award = await client.getAward(14);
console.log(award.title);
console.log(award.imageUrl);
```

### Listing all accounts

You can list all accounts using `listAccounts`. For example:
```js
const accountPaginator = client.listAccounts();
for (const account of await accountPaginator.nextPage()) {
    console.log(account.name);
}
```
Note that this will only fetch the first page of results (20, by default). To fetch more, you should call `nextPage()` repeatedly until it returns an empty array. You can also get a specific page:
```js
const accountPaginator = client.listAccounts();
const data = await accountPaginator.getPage(4);
console.log(data.result);    // Total result count.
for (const account of data.data) {
    console.log(account.name);
}
```
You can use the `search` and `team` options to narrow down results:
```js
const accountPaginator = client.listAccounts({
    team: team, search: 'bob'
});
console.log(`Members from team ${team.name} with "bob" in their name:`);
for (const account of await accountPaginator.nextPage()) {
    console.log(account.name);
}
```

### Listing all teams

You can list all teams using `listTeams`. For example:
```js
const teamPaginator = client.listTeams();
for (const team of await teamPaginator.nextPage()) {
    console.log(team.name);
}
```
This supports the same pagination system as `listAccounts`, as well as the `search` option.

### Creating an account

Registering a user is a simple call to `createAccount`:
```js
const team = await client.getTeam(5);
const account = await client.createAccount({
    id: '1234567',
    name: 'Artemis',
    discriminator: '8472',
    avatarUrl: 'https://picsum.photos/200',
    team: team
});
console.assert(account.name === 'Artemis');
console.assert(account.team.id === 5);
```
Note that this requires an `AppClient` or `UserClient` with the `manageAccountDetails` permission.

You can also chose the permissions to grant the user:
```js
await client.createAccount({
    id: '1234567',
    name: 'Artemis',
    discriminator: '8472',
    permissions: polympics.PolympicsPermissions.manageTeams
        & polympics.PolympicsPermissions.manageAccountDetails
});
```
Note, when granting permissions to a user:

- You must be authenticated.
- You cannot grant permissions you do not have.
- You cannot grant authenticate_users, since that’s not a permission users can have.
- You cannot grant permissions unless you have the manage_permissions permission, except as stated below:
- You can grant the manage_own_team permission to other members of your own team (as long as you also have manage_own_team).

### Editing an account

Editing a user's account can be done with `updateAccount`:
```js
let account = await client.getAccount('41129492792313');
account = await client.updateAccount(account, {
    name: 'Artemis', discriminator: '3910'
});
console.assert(account.name === 'Artemis');
```
This requires an `AppClient` or `UserClient` with the `manageAccountDetails` permission.

You can similarly update a user's team:
```js
account = await client.updateAccount(account, { team: team });
```
This requires an `AppClient` or `UserClient` with the `manageAccountTeams` permission, or a `UserClient` authenticated with the given account.

By setting `team` to `null`, you can remove a user from a team;
```js
account = await client.updateAccount(account, { team: null });
```
This requires permissions as explained above for adding a user to a team,
with the addition that you can remove a user from a team if you are a member
of that team and have the `manageOwnTeam` permission.

You can also update user permissions with the `grantPermissions` and `revokePermissions` options, subject to the rules outlined in "Creating an account".

Example:

```js
account = await client.updateAccount(account, {
    grantPermissions: polympics.PolympicsPermissions.manageOwnTeam,
    revokePermissions: polympics.PolympicsPermissions.manageTeams
});
```

Using the `discordToken` option, you can update a user's name,
discriminator and avatar URL to match Discord. This requires no permissions,
since user tokens can be authenticated with Discord.

Example:
```js
account = await client.updateAccount(account, { discordToken: token });
```

### Deleting an account

You can delete a user's account with the `deleteAccount` method:
```js
const account = await client.g, for the team's name:
```js
teametAccount('124214913289');
await client.deleteAccount(account);
```

This requires an `AppClient` or `UserClient` with the `manageAccountDetails` permission, or just a `UserClient` associated with the account being deleted.

### Creating a team

You can create a team using the `createTeam` method. It accepts one parameter, `name`, for the team's name:
```js
const team = await client.createTeam({ name: 'Gods of Olympus' });
console.assert(team.name === 'Gods of Olympus');
```
This requires an `AppClient` or `UserClient` with the `manageTeams` permission.

### Editing a team

You can edit a team using the `updateTeam` method. It accepts the same `name` parameter as `createTeam`:
```js
let team = await client.getTeam(13);
team = await client.updateTeam(team, { name: 'Cool Kidz' });
console.assert(team.name === 'Cool Kidz');
```

This requires an `AppClient` or `UserClient` with the `manageTeams` permission, or just a `UserClient` with the `manageOwnTeam` permission who is a member of the given team.

### Deleting a team

You can delete a team with the `deleteTeam` method:
```js
let team = await client.getTeam(28);
await client.deleteTeam(team);
```
This requires an `AppClient` or `UserClient` with the `manageTeams` permission, or just a `UserClient` with the `manageOwnTeam` permission who is a member of the given team.

### Creating an award

You can create an award with the ``createAward`` method:

```js
const account_1 = await client.getAccount(508140149014901);
const team = await client.getTeam(123);
const award = await client.createAward({
    title: "Perfect 10 Gold",
    imageUrl: "https://link.to/icon.png",
    team: team,
    accounts: [account_1]
})
console.log(award.id);
console.log(award.title);
```

This requires an `AppClient` or `UserClient` with the `manageAwards` permission.

### Editing an award

You can edit an award with the ``updateAward`` method:

```js
let award = await client.getAward(12);
award = await client.updateAward(award, { title: "Gold - Perfect 10" });
```

This requires an `AppClient` or `UserClient` with the `manageAwards` permission.

### Deleting an award

You can delete an award with the ``deleteAward`` method:

```js
const award = await client.getAward(52);
await client.deleteAward(award)
```

This requires an `AppClient` or `UserClient` with the `manageAwards` permission.

### Giving an award to a user

To give an award to a player, use ``giveAward``:

```js
const account = await client.getAccount(130914109419411);
const award = await client.getAward(19);
await client.giveAward(award, account);
```

This requires an `AppClient` or `UserClient` with the `manageAwards` permission.

### Taking an award from a user

To give an award to a player, use ``takeAward``:

```js
const account = await client.getAccount(8713710931790741);
const award = await client.getAward(13);
await client.takeAward(award, account);
```

This requires an `AppClient` or `UserClient` with the `manageAwards` permission.

### Creating a user auth session

An `AppClient` can create user sessions, which can in turn be used by a `UserClient` as authentication. More usefully, user session can be passed to the frontend, so that the user they are for can manipulate the API client-side. Since an attacker intercepting these credentials could authenticate as the user, these have a short lifetime, by default 30 minutes.

Example:
```js
const account = await client.getAccount('1318219824080');
const session = await client.createSession(account);
console.log(session.expiresAt);
const userClient = polympics.UserClient(session);
```
This requires an `AppClient` with the `authenticateUsers` permission.

### Authenticating via Discord OAuth2

Alternatively, you can use a Discord user authentication token to create a
user session (these can be obtained using Discord OAuth2, which is beyond the
scope of this library). This has the advantage that you do not need to be
otherwise authenticated, so it can be used on the frontend (eg. with the OAuth2
implicit grant flow).

Example:

```js
const session = await client.discordAuthenticate(token)
const userClient = polympics.UserClient(session)
```

Note that the token used must be authorised for the `identify` scope.

### Resetting the client's token

The token of an `AppClient` can be reset using `resetToken`. Note that the client *will* automatically update to use the new token. This function returns an `AppCredentials` object, which can be used in place of credentials, and also provides the attribute `name`, which is the human-readable name of the app.

```js
await client.resetToken();
```
This requires an `AppClient` (you cannot reset a user token, since they are short-lived anyway).

### Getting the authenticated app

When authenticated with an `AppClient`, you can use `getSelf` to get metadata on the authenticated app. Note that unlike `resetToken`, this does *not* return the app's new token.
```js
const app = await client.getSelf();
console.log(app.name);
```

### Getting the authenticated user

A `UserClient` can get the account of the user it has authenticated as using the same method:
```js
const account = await client.getSelf();
console.log(account.name);
```

### Errors

If the API returns an error, the wrapper will raise a `PolympicsError`. This has the `code` attribute (the HTTP status code that was used, eg. `404` or `500`).

There are also the following subclasses:

- `ServerError` indicates a server-side issue that it may be beyond the client's capability to resolve.
- `EmptyResponse` indicates that the server returned no response, but the wrapper expected one.
- `DataError` indicates an issue in the parameters passed to the API. This could indicate an issue in the library, but it will also be raised when a resource is not found. The `issues` attribute gives more detail, which can also be seen in the string representation of the error.
- `ClientError` indicates a client-side issue not covered by `DataError`. The `detail` attribute gives more information, in a human-readable format.
