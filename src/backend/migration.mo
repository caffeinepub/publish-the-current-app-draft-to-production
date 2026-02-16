module {
  type LegacyStripeConfiguration = {
    secretKey : Text;
    allowedCountries : [Text];
  };

  type StripeMode = {
    #test;
    #live;
  };

  type InternalStripeConfiguration = {
    testSecretKey : Text;
    liveSecretKey : Text;
    allowedCountries : [Text];
    activeMode : StripeMode;
  };

  type OldActor = {
    stripeConfiguration : ?LegacyStripeConfiguration;
  };

  type NewActor = {
    stripeConfig : ?InternalStripeConfiguration;
  };

  public func run(old : OldActor) : NewActor {
    let newStripeConfig = switch (old.stripeConfiguration) {
      case (null) { null };
      case (?legacy) {
        ?{
          testSecretKey = legacy.secretKey;
          liveSecretKey = legacy.secretKey;
          allowedCountries = legacy.allowedCountries;
          activeMode = #test;
        };
      };
    };
    {
      stripeConfig = newStripeConfig;
    };
  };
};
