import { Construct } from "constructs";
import { IResolvable, IResolveContext, Lazy } from "aws-cdk-lib";
import { IDomain } from "aws-cdk-lib/aws-opensearchservice";
import { ApiResource } from "./apiResource";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

export interface RoleMappingDefinition {
  backend_roles?: (string | undefined)[];
  hosts?: (string | undefined)[];
  users?: (string | undefined)[];
}

interface RoleMappingProps {
  readonly domain: IDomain;
  readonly masterUserPasswordSecret: ISecret;
  readonly roleName: string;
  readonly roleMappingDefinition: RoleMappingDefinition | IResolvable;
}

export class RoleMapping extends Construct {
  constructor(scope: Construct, id: string, props: RoleMappingProps) {
    super(scope, id);

    this.node.defaultChild = new ApiResource(this, "Default", {
      domain: props.domain,
      masterUserPasswordSecret: props.masterUserPasswordSecret,
      resourceId: props.roleName,
      resourceType: "rolesmapping",
      resourceBody: Lazy.uncachedString({
        produce(ctx: IResolveContext): string | undefined {
          const resolved =
            "resolve" in props.roleMappingDefinition
              ? (props.roleMappingDefinition.resolve(
                  ctx
                ) as RoleMappingDefinition)
              : props.roleMappingDefinition;

          if (resolved.backend_roles) {
            resolved.backend_roles = resolved.backend_roles.filter(
              (x): x is string => !!x
            );
          }
          if (resolved.users) {
            resolved.users = resolved.users.filter((x): x is string => !!x);
          }
          if (resolved.hosts) {
            resolved.hosts = resolved.hosts.filter((x): x is string => !!x);
          }

          return JSON.stringify(resolved);
        },
      }),
    });
  }
}
