import { Construct } from "constructs";
import {
  Architecture,
  Runtime,
  Code,
  SingletonFunction,
} from "aws-cdk-lib/aws-lambda";
import { CustomResource, Duration, IResolvable, Stack } from "aws-cdk-lib";
import { Provider } from "aws-cdk-lib/custom-resources";
import { IDomain } from "aws-cdk-lib/aws-opensearchservice";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

interface SecurityApiResourceProps {
  readonly domain: IDomain;
  readonly masterUserPasswordSecret: ISecret;
  readonly resourceId: string;
  readonly resourceType: string;
  readonly resourceBody: string | IResolvable;
}

export class ApiResource extends Construct {
  constructor(scope: Construct, id: string, props: SecurityApiResourceProps) {
    super(scope, id);

    const onEventHandler = new SingletonFunction(this, "OnEventHandler", {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset(`${__dirname}/../lambdas/on-event`),
      handler: "index.handler",
      architecture: Architecture.ARM_64,
      timeout: Duration.minutes(1),
      uuid: "OpenSearchSecurityApiResource",
    });

    props.masterUserPasswordSecret.grantRead(onEventHandler);

    props.domain.grantPathReadWrite("_plugins/_security/api/*", onEventHandler);

    const stack = Stack.of(scope);
    const providerId = "OpenSearchSecurityApiProvider-v1";
    const provider =
      (stack.node.tryFindChild(providerId) as Provider) ??
      new Provider(this, providerId, {
        onEventHandler,
      });

    const resource = new CustomResource(this, "Resource", {
      serviceToken: provider.serviceToken,
      resourceType: "Custom::OpenSearchRole",
      properties: {
        OSCredentialsSecret: props.masterUserPasswordSecret.secretArn,
        OSEndpoint: props.domain.domainEndpoint,
        resourceBody: props.resourceBody,
        resourceId: props.resourceId,
        resourceType: props.resourceType,
      },
    });
    resource.node.addDependency(props.domain);
    resource.node.addDependency(props.masterUserPasswordSecret);
  }
}
