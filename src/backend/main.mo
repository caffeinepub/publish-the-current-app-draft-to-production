import Migration "migration";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import Token "token";
import Runtime "mo:core/Runtime";

// Use data migration (stateful actor)
(with migration = Migration.run)
actor {
  include MixinStorage();

  type Branding = {
    siteName : Text;
    slogan : Text;
    logo : ?Storage.ExternalBlob;
    icon : ?Storage.ExternalBlob;
  };

  public type StoreBanner = {
    title : Text;
    subtitle : Text;
    bannerImage : ?Storage.ExternalBlob;
  };

  public type MediaFile = {
    name : Text;
    blob : Storage.ExternalBlob;
    contentType : Text;
    uploader : Principal;
  };

  public type Tutorial = {
    id : Text;
    title : Text;
    description : Text;
    difficulty : Difficulty;
    video : MediaFile;
    creator : Principal;
    createdAt : Time.Time;
    isFree : Bool;
  };

  public type CommunityPost = {
    id : Text;
    title : Text;
    content : Text;
    media : [MediaFile];
    author : Principal;
    createdAt : Time.Time;
    likes : Nat;
  };

  public type Product = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    inventory : Nat;
    images : [MediaFile];
  };

  public type Order = {
    id : Text;
    user : Principal;
    products : [OrderedProduct];
    total : Nat;
    status : OrderStatus;
    createdAt : Time.Time;
  };

  public type OrderedProduct = {
    id : Text;
    name : Text;
    price : Nat;
    quantity : Nat;
  };

  public type StreamedContent = {
    id : Text;
    title : Text;
    category : Text;
    media : MediaFile;
    creator : Principal;
    createdAt : Time.Time;
  };

  public type TokenTransaction = {
    from : ?Principal;
    to : ?Principal;
    amount : Nat;
    description : Text;
    timestamp : Time.Time;
    transactionType : {
      #mint;
      #transfer;
      #spend;
      #earn;
    };
  };

  public type UserProfile = {
    username : Text;
    bio : Text;
    uploadedContent : [MediaFile];
    purchasedContent : [Text];
    createdAt : Time.Time;
    role : Role;
    tokenBalance : Nat;
    transactionHistory : [TokenTransaction];
    aiAssistantEnabled : Bool;
    aiInteractionHistory : [AIInteraction];
  };

  public type Difficulty = {
    #beginner;
    #intermediate;
    #advanced;
  };

  public type OrderStatus = {
    #pending;
    #completed;
    #cancelled;
  };

  public type Role = {
    #admin;
    #user;
    #guest;
  };

  public type AIInteraction = {
    tutorialId : Text;
    timestamp : Time.Time;
    feedback : Text;
  };

  public type AIRequest = {
    tutorialId : Text;
    videoTimestamp : Nat;
    userAnswers : [Text];
  };

  public type AIResponse = {
    feedback : Text;
    suggestions : [Text];
  };

  public type AIFeedback = {
    tutorialId : Text;
    videoTimestamp : Nat;
    feedback : Text;
  };

  public type ChatMessage = {
    sender : Text;
    message : Text;
    timestamp : Time.Time;
    isAI : Bool;
  };

  public type ChatHistory = {
    messages : List.List<ChatMessage>;
    isOpen : Bool;
  };

  // ===== Branding =====

  var branding : Branding = {
    siteName = "Digital Creators Platform";
    slogan = "OC Club";
    logo = null;
    icon = null;
  };

  var storeBanner : StoreBanner = {
    title = "Welcome to the Store";
    subtitle = "Discover great products!";
    bannerImage = null;
  };

  // Prefabs
  let accessControlState = AccessControl.initState();
  let tokenSystem = Token.init();

  // State
  let mediaFiles = Map.empty<Text, MediaFile>();
  let tutorials = Map.empty<Text, Tutorial>();
  let communityPosts = Map.empty<Text, CommunityPost>();
  let storeProducts = Map.empty<Text, Product>();
  let orders = Map.empty<Text, Order>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let streamedContent = Map.empty<Text, StreamedContent>();
  let tutorialCompletions = Map.empty<Principal, Map.Map<Text, Bool>>();
  let aiFeedbackStorage = Map.empty<Text, [AIFeedback]>();
  let stripeSessionOwners = Map.empty<Text, Principal>();

  // AI Chat Tutor State - Per-user chat histories
  let userChatHistories = Map.empty<Principal, List.List<ChatMessage>>();

  // Stripe configuration state (persistent)
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  // ===== Access Control Functions (Required) =====

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // ===== User Profile Functions (Required) =====

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ===== Store Banner Functions =====

  public query func getStoreBanner() : async StoreBanner {
    storeBanner;
  };

  public shared ({ caller }) func updateStoreBanner(newStoreBanner : StoreBanner) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update Store banner");
    };
    storeBanner := newStoreBanner;
  };

  // ===== Branding Functions =====

  public query func getBranding() : async Branding {
    branding;
  };

  public shared ({ caller }) func updateBranding(newBranding : Branding) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update branding");
    };
    branding := newBranding;
  };

  // ===== Media File Functions =====

  // Helper function to check if a media file is used in public content (posts, products, streams)
  func isPublicMedia(mediaName : Text) : Bool {
    for (post in communityPosts.values()) {
      for (media in post.media.vals()) {
        if (media.name == mediaName) {
          return true;
        };
      };
    };

    for (product in storeProducts.values()) {
      for (image in product.images.vals()) {
        if (image.name == mediaName) {
          return true;
        };
      };
    };

    for (stream in streamedContent.values()) {
      if (stream.media.name == mediaName) {
        return true;
      };
    };

    false;
  };

  // Helper function to check if user has access to a tutorial
  func hasAccessToTutorial(caller : Principal, tutorialId : Text) : Bool {
    switch (tutorials.get(tutorialId)) {
      case (null) { false };
      case (?tutorial) {
        if (tutorial.isFree) {
          return true;
        };
        if (tutorial.creator == caller) {
          return true;
        };
        if (AccessControl.isAdmin(accessControlState, caller)) {
          return true;
        };
        // Check if user purchased the tutorial
        switch (userProfiles.get(caller)) {
          case (null) { false };
          case (?profile) {
            profile.purchasedContent.find<Text>(func(id) { id == tutorialId }) != null;
          };
        };
      };
    };
  };

  public query ({ caller }) func getBlobById(id : Text) : async MediaFile {
    switch (mediaFiles.get(id)) {
      case (null) { Runtime.trap("Media file not found") };
      case (?media) {
        // Check authorization
        // 1. Public media accessible to all
        if (isPublicMedia(media.name)) {
          return media;
        };

        // 2. Check if it's a tutorial video
        for (tutorial in tutorials.values()) {
          if (tutorial.video.name == media.name) {
            if (hasAccessToTutorial(caller, tutorial.id)) {
              return media;
            } else {
              Runtime.trap("Unauthorized: No access to this tutorial content");
            };
          };
        };

        // 3. Private media: accessible only to uploader or admin
        if (media.uploader == caller or AccessControl.isAdmin(accessControlState, caller)) {
          return media;
        };

        Runtime.trap("Unauthorized: Cannot access this media file");
      };
    };
  };

  public shared ({ caller }) func uploadMediaFile(media : MediaFile) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload media files");
    };
    if (media.uploader != caller) {
      Runtime.trap("Unauthorized: Cannot upload media on behalf of another user");
    };
    mediaFiles.add(media.name, media);
    media.name;
  };

  public query ({ caller }) func listMedia() : async [MediaFile] {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      mediaFiles.values().toArray();
    } else {
      let filtered = mediaFiles.values().toArray().filter(
        func(m) {
          m.uploader == caller or isPublicMedia(m.name);
        }
      );
      filtered;
    };
  };

  // ===== Store Product Functions =====

  public shared ({ caller }) func addProduct(product : Product) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };

    storeProducts.add(product.id, product);
    product.id;
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    switch (storeProducts.get(product.id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        storeProducts.add(product.id, product);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };

    switch (storeProducts.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        storeProducts.remove(productId);
      };
    };
  };

  // ===== Stripe Integration (Required) =====

  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    // Authorization: Only session owner or admin can check session status
    switch (stripeSessionOwners.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only check your own session status");
        };
      };
    };

    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    // Authorization: Only authenticated users can create checkout sessions
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };

    let sessionId = await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);

    // Store session ownership for authorization checks
    stripeSessionOwners.add(sessionId, caller);

    sessionId;
  };

  // ===== Public Store Browsing =====

  public query func listProducts() : async [Product] {
    storeProducts.values().toArray();
  };
};

