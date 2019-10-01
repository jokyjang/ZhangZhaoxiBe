package com.zzx.games.cdk;

import software.amazon.awscdk.core.Construct;
import software.amazon.awscdk.core.Stack;
import software.amazon.awscdk.core.StackProps;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.ecs.AssetImageProps;
import software.amazon.awscdk.services.ecs.Cluster;
import software.amazon.awscdk.services.ecs.ClusterProps;
import software.amazon.awscdk.services.ecs.ContainerImage;
import software.amazon.awscdk.services.ecs.patterns.ApplicationLoadBalancedFargateService;
import software.amazon.awscdk.services.ecs.patterns.ApplicationLoadBalancedFargateServiceProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.BaseLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ILoadBalancerV2;
import software.amazon.awscdk.services.route53.ARecord;
import software.amazon.awscdk.services.route53.ARecordProps;
import software.amazon.awscdk.services.route53.HostedZone;
import software.amazon.awscdk.services.route53.HostedZoneProviderProps;
import software.amazon.awscdk.services.route53.RecordTarget;
import software.amazon.awscdk.services.route53.targets.LoadBalancerTarget;

/**
 * This is a stack that creates a sub-domain games.{domain_name} for the ECS based services.
 */
public class GamesStack extends Stack {
    private static final String DOMAIN_NAME = "zhangzhaoxi.be";

    public GamesStack(Construct parent, String id, StackProps props) {
        super(parent, id, props);
        init();
    }

    private void init() {
        Cluster cluster = createCluster();
        ApplicationLoadBalancedFargateService service = createLoadBalancedFargateService(cluster);
        createRoute53Record(service.getLoadBalancer());
    }

    private Cluster createCluster() {
        return new Cluster(this, "GamesCluster", ClusterProps.builder()
            .vpc(new Vpc(this, "GamesVpc", VpcProps.builder().build()))
            .clusterName("GamesCluster")
            .build());
    }

    private ApplicationLoadBalancedFargateService createLoadBalancedFargateService(Cluster cluster) {
        return new ApplicationLoadBalancedFargateService(
            this, "GamesFargateService",
            ApplicationLoadBalancedFargateServiceProps.builder()
                .cluster(cluster)
                .image(ContainerImage.fromAsset("../games", AssetImageProps.builder().build()))
                .containerPort(8080)
                .serviceName("Games")
//                .taskRole() // assign task role to the task for calling AWS
                .publicLoadBalancer(true)
                .build()
        );
    }

    private void createRoute53Record(BaseLoadBalancer loadBalancer) {
        new ARecord(this, "GamesRecordSet", ARecordProps.builder()
            .zone(HostedZone.fromLookup(this, "HostedZone", HostedZoneProviderProps.builder()
                .domainName(DOMAIN_NAME)
                .build()))
            .recordName("games")
            .target(RecordTarget.fromAlias(new LoadBalancerTarget((ILoadBalancerV2) loadBalancer)))
            .build()
        );
    }
}
