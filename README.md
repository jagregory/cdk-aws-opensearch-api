# AWS OpenSearch API resources for AWS CDK

AWS CDK constructs for managing OpenSearch API resources.

This module can be useful when you need to manage the resources _inside_ an OpenSearch cluster, for example creating
Roles and Role Mappings for fine grained access control.

<!-- toc -->

- [Usage](#usage)
  - [Roles](#roles)
  - [Role Mappings](#role-mappings)
- [Supported features](#supported-features)

<!-- tocstop -->

## Usage

Prereqs:

1. You must have Fine Grained Access Control enabled with a Master User, the Custom Resources in this package need the
   master user to authenticate.
2. The Master User credentials must be in a Secrets Manager secret, in the format of `{"username":"x","password":y"}`

### Roles

```typescript
import { Role } from "cdk-aws-opensearch-api";

// in your Stack/Construct
new Role(this, "MyRole", {
  domain: yourOpenSearchDomain,
  roleName: "roleName",
  masterUserPasswordSecret: theMasterUserCredentialsInSecretsManager,
   
  // this definition is what you'd PUT to the OpenSearch API:
  // https://opensearch.org/docs/latest/security-plugin/access-control/api/#create-role
  roleDefinition: {
    cluster_permissions: ["indices:data/write/*"],
    index_permissions: [{
      index_patterns: ["*"],
      allowed_actions: ["crud"],
    }],
  },
});
```

### Role Mappings

If you have access to a `Role` already, then you can call the `addRoleMapping` function to change the Role Mapping for
that role:

```typescript
import { Role } from "cdk-aws-opensearch-api";

const myRole = new Role(/* ... */);

myRole.addRoleMapping({
  // this definition is what you'd PUT to the OpenSearch API:
  // https://opensearch.org/docs/latest/security-plugin/access-control/api/#create-role-mapping
  backend_roles: ["starfleet", "captains", "defectors", "cn=ldaprole,ou=groups,dc=example,dc=com"],
  hosts: ["*.starfleetintranet.com"],
  users: ["worf"]
});
```

Otherwise, you can create a Role Mapping independently:

```typescript
import { RoleMapping } from "cdk-aws-opensearch-api";

// in your Stack/Construct
new RoleMapping(this, "MyRoleMapping", {
  domain: yourOpenSearchDomain,
  roleName: "roleName",
  masterUserPasswordSecret: theMasterUserCredentialsInSecretsManager,

  // this definition is what you'd PUT to the OpenSearch API:
  // https://opensearch.org/docs/latest/security-plugin/access-control/api/#create-role-mapping
  roleDefinition: {
    backend_roles: ["starfleet", "captains", "defectors", "cn=ldaprole,ou=groups,dc=example,dc=com"],
    hosts: ["*.starfleetintranet.com"],
    users: ["worf"]
  },
});
```

## Supported features

- Roles
- Role Mappings

There's also a low-level fallback resource called `ApiResource` which you can use to manage other API resources that
don't have a construct yet. _Use at your own risk_.
