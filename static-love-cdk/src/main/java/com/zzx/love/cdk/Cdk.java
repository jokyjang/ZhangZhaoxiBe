package com.zzx.love.cdk;

import software.amazon.awscdk.core.App;
import software.amazon.awscdk.core.Environment;
import software.amazon.awscdk.core.StackProps;

public class Cdk {
    public static void main(String[] args) {
        App app = new App();
        new StaticLoveStack(app, "StaticLove", StackProps.builder()
            .env(Environment.builder()
                .account("178510302273")
                .region("us-west-2")
                .build())
            .build()
        );
        app.synth();
    }
}
