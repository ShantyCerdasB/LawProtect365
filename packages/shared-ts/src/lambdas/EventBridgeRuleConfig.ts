/**
 * @fileoverview EventBridgeRuleConfig - Configuration for EventBridge rules
 * @summary Configuration for EventBridge rules that trigger Lambda functions
 * @description Provides configuration examples and utilities for setting up
 * EventBridge rules that trigger Lambda functions on a schedule.
 */

/**
 * EventBridge rule configuration for scheduled event processing
 * 
 * This configuration should be used to create an EventBridge rule that
 * triggers the EventPublisherLambda function on a schedule.
 */
export const EVENT_PUBLISHER_RULE_CONFIG = {
  /** Rule name */
  name: 'EventPublisherScheduleRule',
  /** Schedule expression - runs every 5 minutes */
  scheduleExpression: 'rate(5 minutes)',
  /** Event pattern for scheduled events */
  eventPattern: {
    source: ['aws.events'],
    'detail-type': ['Scheduled Event']
  },
  /** Target configuration */
  target: {
    /** Lambda function ARN */
    arn: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:EventPublisherLambda',
    /** Input transformation */
    inputTransformer: {
      inputPathsMap: {
        time: '$.time'
      },
      inputTemplate: JSON.stringify({
        source: 'aws.events',
        'detail-type': 'Scheduled Event',
        time: '<time>',
        region: '${AWS::Region}'
      })
    }
  }
};

/**
 * CloudFormation template snippet for EventBridge rule
 * 
 * This can be used in CloudFormation or CDK to create the EventBridge rule
 * that triggers the EventPublisherLambda function.
 */
export const CLOUDFORMATION_TEMPLATE = {
  EventPublisherScheduleRule: {
    Type: 'AWS::Events::Rule',
    Properties: {
      Name: EVENT_PUBLISHER_RULE_CONFIG.name,
      ScheduleExpression: EVENT_PUBLISHER_RULE_CONFIG.scheduleExpression,
      State: 'ENABLED',
      Targets: [
        {
          Arn: EVENT_PUBLISHER_RULE_CONFIG.target.arn,
          Id: 'EventPublisherLambdaTarget',
          InputTransformer: EVENT_PUBLISHER_RULE_CONFIG.target.inputTransformer
        }
      ]
    }
  },
  EventPublisherLambdaPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      FunctionName: 'EventPublisherLambda',
      Action: 'lambda:InvokeFunction',
      Principal: 'events.amazonaws.com',
      SourceArn: {
        'Fn::GetAtt': ['EventPublisherScheduleRule', 'Arn']
      }
    }
  }
};

/**
 * CDK example for creating EventBridge rule
 * 
 * This shows how to create the EventBridge rule using AWS CDK.
 */
export const CDK_EXAMPLE = `
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

// Create EventBridge rule
const eventPublisherRule = new Rule(this, 'EventPublisherScheduleRule', {
  schedule: Schedule.rate(Duration.minutes(5)),
  description: 'Triggers EventPublisherLambda every 5 minutes'
});

// Add Lambda function as target
eventPublisherRule.addTarget(new LambdaFunction(eventPublisherLambda, {
  event: RuleTargetInput.fromObject({
    source: 'aws.events',
    'detail-type': 'Scheduled Event',
    time: EventField.fromPath('$.time'),
    region: Stack.of(this).region
  })
}));
`;
