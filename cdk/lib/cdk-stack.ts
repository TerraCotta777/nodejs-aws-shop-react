import * as cdk from "aws-cdk-lib";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import {
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

export class Frontend extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "ShopReactBucket", {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      "ShopReactBucketOAI",
      {
        comment: "OAI for ShopReactBucket",
      }
    );
    bucket.grantRead(originAccessIdentity);

    const distribution = new Distribution(this, "ShopReactCloudFront", {
      defaultBehavior: {
        origin: new S3Origin(bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    new s3deploy.BucketDeployment(this, "ShopReactDeployment", {
      sources: [s3deploy.Source.asset("./resources/build")],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "Domain URL", {
      value: distribution.distributionDomainName,
    });
  }
}
