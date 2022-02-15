# AWS OpenSearch API resources for AWS CDK

AWS CDK constructs for managing OpenSearch API resources.

This module can be useful when you need to manage the resources _inside_ an OpenSearch cluster, for example creating
Roles and Role Mappings for fine grained access control.

## Usage

TODO

## Support features

- Roles
- Role Mappings

There's also a low-level fallback resource called `ApiResource` which you can use to manage other API resources that
don't have a construct yet. _Use at your own risk_.