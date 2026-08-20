# Tracking user information

> Every method below is also available grouped under the `user` namespace (e.g. `user.setAttributes`) — see [Namespaced API](../NamespacedAPI/README.md).

## External User ID

Add your custom External User Ids within `Reteno` by the following method:

```ts
import { setUserAttributes } from "reteno-react-native-sdk";

setUserAttributes({
  externalUserId: "USER_ID",
  user,
});
```

## User attributes

User attributes are attributes you define to describe segments of your user base, such as language preference or geographic location.

Add user attributes like phone, email, etc by the following method:

```ts
import { setUserAttributes } from 'reteno-react-native-sdk';

setUserAttributes({
  externalUserId: "USER_ID",
  user: {
    userAttributes: {
      phone: "+380501234567",
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
      languageCode: "en",
      timeZone: "Europe/Kyiv",
      marketId: "market_1",
      fields: [{ key: "plan", value: "premium" }],
    },
    subscriptionKeys: ["news"],
    groupNamesInclude: ["vip"],
    groupNamesExclude: ["inactive"],
  },
});
```

The `userAttributes` object structure:

```typescript
type Address = {
  region?: string | null;
  town?: string | null;
  address?: string | null;
  postcode?: string | null;
};

type Field = {
  key: string;
  value: string;
};

type Fields = Field[];

type UserAttributes = {
  phone?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  timeZone?: string | null;
  marketId?: string | null;
  address?: Address | null;
  fields?: Fields | null;
};

type User = {
  userAttributes?: UserAttributes | null;
  subscriptionKeys?: string[] | null;
  groupNamesInclude?: string[] | null;
  groupNamesExclude?: string[] | null;
};

type SetUserAttributesPayload = {
  externalUserId: string;
  user: User;
};
```

**Note**

`LanguageCode`

Data about language in [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html) format. Primary language subtag in [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format is required. Example: de-AT

`TimeZone`

Item from [TZ database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). Example: `Europe/Kyiv`

`MarketId`

External market identifier. Available since `reteno-react-native-sdk` `v2.1.0` for `setUserAttributes`, `setMultiAccountUserAttributes`, and `setAnonymousUserAttributes`.

The value can contain up to 64 Latin letters, digits, hyphens (`-`), and underscores (`_`).

Pass an empty string (`""`) to explicitly clear the field on the backend:

```ts
setUserAttributes({
  externalUserId: "USER_ID",
  user: {
    userAttributes: {
      marketId: "",
    },
  },
});
```

Omit `marketId` to keep the existing value unchanged.

## Multi-account support

If one device is shared between multiple accounts and you want push delivery for each account, use `setMultiAccountUserAttributes` instead of `setUserAttributes`.

```ts
import { setMultiAccountUserAttributes } from "reteno-react-native-sdk";

setMultiAccountUserAttributes({
  externalUserId: "USER_ID",
  user: {
    userAttributes: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      marketId: "market_1",
    },
  },
});
```

## Anonymous User Attributes

Reteno SDK allows tracking anonymous user attributes. To start tracking information about user without identificator, use `setAnonymousUserAttributes` function:

```typescript
function setAnonymousUserAttributes(
  payload: AnonymousUserAttributes
): Promise<void>;

type AnonymousUserAttributes = {
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  languageCode?: string | null | undefined;
  timeZone?: string | null | undefined;
  marketId?: string | null | undefined;
  address?: Address | null | undefined;
  fields?: Fields | null | undefined;
};
```

Example:

```ts
import { setAnonymousUserAttributes } from "reteno-react-native-sdk";

setAnonymousUserAttributes({
  firstName: "Guest",
  lastName: "User",
  languageCode: "en",
  timeZone: "Europe/Kyiv",
  marketId: "market_1",
  fields: [{ key: "source", value: "organic" }],
});
```

> **Note**: you can't provide anonymous user attributes with **phone** or/and **email**. For that purpose use `setUserAttributes` method with externalUserId
