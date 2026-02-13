import Map "mo:core/Map";
import Stripe "stripe/stripe";
import Principal "mo:core/Principal";

module {
  // Redefine types from main.mo (for migration only!)
  type MediaFile = {
    name : Text;
    blob : Blob;
    contentType : Text;
    uploader : Principal;
  };

  // Only use new format with all fields (no migration needed if we keep everything the same).
  type State = {
    storeProducts : Map.Map<Text, { id : Text; name : Text; description : Text; price : Nat; inventory : Nat; images : [MediaFile] }>;
    stripeConfiguration : ?Stripe.StripeConfiguration;
    stripeSessionOwners : Map.Map<Text, Principal>;
  };

  public func run(store : State) : State {
    store;
  };
};
