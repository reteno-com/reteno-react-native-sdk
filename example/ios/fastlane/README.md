# Fastlane iOS Automation Guide

## Installation

Make sure you have the latest version of the Xcode Command Line Tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see the official guide:  
👉 [Installing fastlane](https://docs.fastlane.tools/#installing-fastlane)

---

## Environment Setup

### 1. Create `.env` File

Before using _fastlane_, create a `.env` file by copying the structure from the existing `.env.example` file:

```sh
cp .env.example .env
```

Fill in all required environment variables according to your project setup.

---

## Certificate Management

### 2. Generate Certificates

To generate the necessary development, AdHoc, and App Store certificates, run:

```sh
[bundle exec] fastlane ios make_certs
```

> If you have set the `MATCH_TYPE` environment variable, only the specified certificate type will be generated.

---

### 3. Certificate Quota Exceeded?

If you receive an error saying the certificate limit has been exceeded:

1. **Contact your Project Manager or responsible team** to revoke unused certificates from the Apple Developer account.
2. After removal, re-run the certificate creation command:

```sh
[bundle exec] fastlane ios make_certs
```

> ⏳ Sometimes, certificate revocation may take **up to 24 hours** to take effect. If you still face issues, try again later.

---

## Deployment

### 4. Deploy the App

Once certificates are set up correctly, you can build and distribute the app using:

```sh
[bundle exec] fastlane ios deploy
```

This will:
- Build the iOS app
- Archive it
- Upload it to **Crashlytics**

---

## Fastlane iOS Actions

Here’s a list of available _fastlane_ lanes for iOS:

### `add_cocoapods_keys`

```sh
[bundle exec] fastlane ios add_cocoapods_keys
```

Add or remove keys from the repository.  
Example:  
`key1:value1 key2:value2 key3:` → Adds `key1` and `key2`, removes `key3`.

---

### `sync_cocoapods_keys`

```sh
[bundle exec] fastlane ios sync_cocoapods_keys
```

Synchronizes your keychain with private keys.

---

### `known_flags`

```sh
[bundle exec] fastlane ios known_flags
```

Displays known build flags.

---

### `sync_certs`

```sh
[bundle exec] fastlane ios sync_certs
```

Synchronizes development, AdHoc, and App Store certificates (or the one specified via `MATCH_TYPE`).

---

### `make_certs`

```sh
[bundle exec] fastlane ios make_certs
```

Generates certificates (same behavior as above).

---

### `drop_certs`

```sh
[bundle exec] fastlane ios drop_certs
```

Deletes certificates (or the one specified via `MATCH_TYPE`).

---

### `deploy`

```sh
[bundle exec] fastlane ios deploy
```

Builds, archives, and uploads your app to **Crashlytics**.

---

### `bump_version`

```sh
[bundle exec] fastlane ios bump_version
```

Bumps the app version.  
Available types: `major`, `minor`, `patch` (default: `patch`).

---

### `bump_build_number`

```sh
[bundle exec] fastlane ios bump_build_number
```

Increments the build number by 1.

---

### `archive`

```sh
[bundle exec] fastlane ios archive
```

Generates an archive from the current codebase.

---

### `upload_symbols`

```sh
[bundle exec] fastlane ios upload_symbols
```

Downloads dSYMs from App Store and uploads them to **Crashlytics**.

---

## Resources

- [🔗 fastlane.tools](https://fastlane.tools)
- [📘 fastlane Documentation](https://docs.fastlane.tools)

> _Note: This README is auto-generated and may be overwritten when running `fastlane`._
