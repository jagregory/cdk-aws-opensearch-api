import { Construct } from "constructs";
import { Lazy } from "aws-cdk-lib";
import { IDomain } from "aws-cdk-lib/aws-opensearchservice";
import { ApiResource } from "./apiResource";
import { RoleMapping, RoleMappingDefinition } from "./roleMapping";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

interface RoleDefinition {
  cluster_permissions?: string[];
  index_permissions?: {
    index_patterns?: string[];
    dls?: string;
    fls?: string[];
    masked_fields?: string[];
    allowed_actions?: string[];
  }[];
  tenant_permissions?: {
    tenant_patterns: string[];
    allowed_actions: string[];
  }[];
}

interface RoleProps {
  readonly domain: IDomain;
  readonly masterUserPasswordSecret: ISecret;
  readonly roleName: string;
  readonly roleDefinition: RoleDefinition;
}

export class Role extends Construct {
  public readonly roleName: string;
  private roleMappingDefinition: RoleMappingDefinition = {
    backend_roles: [],
    hosts: [],
    users: [],
  };

  constructor(scope: Construct, id: string, props: RoleProps) {
    super(scope, id);

    this.roleName = props.roleName;
    const defaultResource = new ApiResource(this, "Default", {
      domain: props.domain,
      masterUserPasswordSecret: props.masterUserPasswordSecret,
      resourceId: this.roleName,
      resourceType: "roles",
      resourceBody: Lazy.uncachedString({
        produce() {
          return JSON.stringify(props.roleDefinition);
        },
      }),
    });

    const roleMapping = new RoleMapping(this, "RoleMapping", {
      domain: props.domain,
      masterUserPasswordSecret: props.masterUserPasswordSecret,
      roleName: this.roleName,
      roleMappingDefinition: Lazy.any({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        produce: (): any => {
          return this.roleMappingDefinition ?? {};
        },
      }),
    });
    roleMapping.node.addDependency(defaultResource);
  }

  public addRoleMapping(roleMapping: RoleMappingDefinition): void {
    this.roleMappingDefinition.backend_roles = [
      ...(this.roleMappingDefinition.backend_roles ?? []),
      ...(roleMapping.backend_roles ?? []),
    ];
    this.roleMappingDefinition.hosts = [
      ...(this.roleMappingDefinition.hosts ?? []),
      ...(roleMapping.hosts ?? []),
    ];
    this.roleMappingDefinition.users = [
      ...(this.roleMappingDefinition.users ?? []),
      ...(roleMapping.users ?? []),
    ];
  }
}
