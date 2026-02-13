import Principal "mo:core/Principal";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import Token "token";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

actor {
  include MixinStorage();

  // Types
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

  module Tutorial {
    public func compare(left : Tutorial, right : Tutorial) : Order.Order {
      Text.compare(left.id, right.id);
    };
  };

  module OrderedProduct {
    public func compare(left : OrderedProduct, right : OrderedProduct) : Order.Order {
      Text.compare(left.id, right.id);
    };
  };

  module Product {
    public func compare(left : Product, right : Product) : Order.Order {
      Text.compare(left.id, right.id);
    };
  };

  module MediaFile {
    public func compare(left : MediaFile, right : MediaFile) : Order.Order {
      Text.compare(left.name, right.name);
    };
  };

  module StreamedContent {
    public func compare(left : StreamedContent, right : StreamedContent) : Order.Order {
      Text.compare(left.id, right.id);
    };
  };

  module CommunityPost {
    public func compare(left : CommunityPost, right : CommunityPost) : Order.Order {
      Text.compare(left.id, right.id);
    };
  };

  module Role {
    public func compare(left : Role, right : Role) : Order.Order {
      switch (left, right) {
        case (#admin, #user) { #less };
        case (#admin, #guest) { #less };
        case (#user, #admin) { #greater };
        case (#user, #guest) { #less };
        case (#guest, #admin) { #greater };
        case (#guest, #user) { #greater };
        case (_, _) { #equal };
      };
    };
  };

  // Prefabs
  let accessControlState = AccessControl.initState();
  let tokenSystem = Token.init();

  // State
  var mediaFiles = Map.empty<Text, MediaFile>();
  var tutorials = Map.empty<Text, Tutorial>();
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

  // Helper function to check if user has purchased or has access to tutorial
  func hasAccessToTutorial(caller : Principal, tutorialId : Text) : Bool {
    // Check if tutorial exists
    switch (tutorials.get(tutorialId)) {
      case (null) { return false };
      case (?tutorial) {
        // Free tutorials are accessible to everyone
        if (tutorial.isFree) {
          return true;
        };

        // Admins have access to all tutorials
        if (AccessControl.isAdmin(accessControlState, caller)) {
          return true;
        };

        // Creator has access to their own tutorials
        if (tutorial.creator == caller) {
          return true;
        };

        // Check if user has purchased the tutorial
        switch (userProfiles.get(caller)) {
          case (null) { return false };
          case (?profile) {
            for (purchasedId in profile.purchasedContent.vals()) {
              if (purchasedId == tutorialId) {
                return true;
              };
            };
            return false;
          };
        };
      };
    };
  };

  // Helper function to find which tutorial uses a specific media file
  func getTutorialByMedia(mediaName : Text) : ?Tutorial {
    for (tutorial in tutorials.values()) {
      if (tutorial.video.name == mediaName) {
        return ?tutorial;
      };
    };
    null;
  };

  // Helper function to count how many products use a specific image
  func countProductsUsingImage(imageName : Text) : Nat {
    var count = 0;
    for (product in storeProducts.values()) {
      for (image in product.images.vals()) {
        if (image.name == imageName) {
          count += 1;
        };
      };
    };
    count;
  };

  // Token System Access
  public shared ({ caller }) func mintTokens(recipient : Principal, amount : Nat, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mint tokens");
    };
    Token.mintTokens(tokenSystem, recipient, amount, description, ?caller);
  };

  public shared ({ caller }) func transferTokens(to : Principal, amount : Nat, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can transfer tokens");
    };
    Token.transferTokens(tokenSystem, caller, to, amount, description);
  };

  public shared query ({ caller }) func getBalance(user : Principal) : async Nat {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance");
    };
    Token.getBalance(tokenSystem, user);
  };

  public shared query ({ caller }) func getTransactionHistory(user : Principal) : async [TokenTransaction] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own transaction history");
    };
    Token.getTransactionHistory(tokenSystem, user);
  };

  public shared ({ caller }) func spendTokens(amount : Nat, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can spend tokens");
    };
    Token.spendTokens(tokenSystem, caller, amount, description);
  };

  // Internal function for automatic reward distribution
  func grantRewardTokens(user : Principal, amount : Nat, description : Text) {
    Token.recordEarning(tokenSystem, user, amount, description);
  };

  // Admin override for manual reward distribution
  public shared ({ caller }) func recordEarning(user : Principal, amount : Nat, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can record earnings");
    };
    Token.recordEarning(tokenSystem, user, amount, description);
  };

  // Tutorial completion tracking and rewards
  public shared ({ caller }) func completeTutorial(tutorialId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete tutorials");
    };

    // Check if user has access to the tutorial
    if (not hasAccessToTutorial(caller, tutorialId)) {
      Runtime.trap("Unauthorized: You must purchase this tutorial before completing it");
    };

    switch (tutorials.get(tutorialId)) {
      case (null) { Runtime.trap("Tutorial not found") };
      case (?tutorial) {
        let userCompletions = switch (tutorialCompletions.get(caller)) {
          case (null) { Map.empty<Text, Bool>() };
          case (?completions) { completions };
        };

        switch (userCompletions.get(tutorialId)) {
          case (?true) { Runtime.trap("Tutorial already completed") };
          case (_) {
            userCompletions.add(tutorialId, true);
            tutorialCompletions.add(caller, userCompletions);

            let rewardAmount = switch (tutorial.difficulty) {
              case (#beginner) { 10 };
              case (#intermediate) { 25 };
              case (#advanced) { 50 };
            };

            grantRewardTokens(caller, rewardAmount, "Tutorial completion: " # tutorial.title);
          };
        };
      };
    };
  };

  // 1. Media File Handling (search, manage, persistent)
  // Media files authorization:
  // - Public media (posts, products, streams) accessible to all
  // - Tutorial videos: accessible only if user has access to that tutorial
  // - Private media: accessible only to uploader or admin
  public query ({ caller }) func getBlobById(id : Text) : async MediaFile {
    switch (mediaFiles.get(id)) {
      case (null) { Runtime.trap("Media file not found") };
      case (?blob) {
        // Check if it's a tutorial video
        switch (getTutorialByMedia(id)) {
          case (?tutorial) {
            // Tutorial video - check tutorial access
            if (not hasAccessToTutorial(caller, tutorial.id)) {
              Runtime.trap("Unauthorized: You must have access to this tutorial to view its video");
            };
          };
          case (null) {
            // Not a tutorial video - check if public or owned
            if (not isPublicMedia(id) and blob.uploader != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only view public media or your own media files");
            };
          };
        };
        blob;
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
      mediaFiles.values().toArray().sort();
    } else {
      let filtered = mediaFiles.values().toArray().filter(
        func(m) {
          m.uploader == caller or isPublicMedia(m.name);
        }
      );
      filtered.sort();
    };
  };

  public shared ({ caller }) func addTutorial(tutorial : Tutorial) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add tutorials");
    };
    if (tutorial.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Cannot create tutorial on behalf of another user");
    };
    tutorials.add(tutorial.id, tutorial);
    tutorial.id;
  };

  // Allow guests to browse tutorials (metadata only, video access controlled separately)
  public query func listTutorials() : async [Tutorial] {
    tutorials.values().toArray().sort();
  };

  // Allow guests to filter tutorials by difficulty for browsing
  public query func filterTutorialsByDifficulty(difficulty : Difficulty) : async [Tutorial] {
    let filtered = tutorials.values().toArray().filter(
      func(t) {
        t.difficulty == difficulty;
      }
    );
    filtered.sort();
  };

  public shared ({ caller }) func addPost(post : CommunityPost) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add posts");
    };
    if (post.author != caller) {
      Runtime.trap("Unauthorized: Cannot create post on behalf of another user");
    };
    communityPosts.add(post.id, post);
    post.id;
  };

  // Allow guests to browse community posts
  public query func listPosts() : async [CommunityPost] {
    communityPosts.values().toArray().sort();
  };

  public shared ({ caller }) func addProduct(product : Product) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add products");
    };

    // Validate that all product images exist and caller has permission to use them
    for (image in product.images.vals()) {
      switch (mediaFiles.get(image.name)) {
        case (null) {
          Runtime.trap("Invalid product: Image '" # image.name # "' does not exist");
        };
        case (?existingMedia) {
          // Verify caller uploaded the image or is admin
          if (existingMedia.uploader != caller and not AccessControl.isAdmin(accessControlState, caller)) {
            Runtime.trap("Unauthorized: Cannot use images uploaded by other users");
          };
        };
      };
    };

    storeProducts.add(product.id, product);
    product.id;
  };

  // Allow guests to browse store products
  public query func listProducts() : async [Product] {
    storeProducts.values().toArray().sort();
  };

  public shared ({ caller }) func placeOrder(order : Order) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    if (order.user != caller) {
      Runtime.trap("Unauthorized: Cannot place order on behalf of another user");
    };
    orders.add(order.id, order);
    order.id;
  };

  public shared query ({ caller }) func getOrder(orderId : Text) : async ?Order {
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        if (order.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        ?order;
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (profile.username.size() == 0) {
      Runtime.trap("Username cannot be empty");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public shared query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func updateProfile(profile : UserProfile) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    if (profile.username.size() == 0) {
      Runtime.trap("Username cannot be empty");
    };
    userProfiles.add(caller, profile);
    "Profile updated";
  };

  public shared ({ caller }) func addStream(content : StreamedContent) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add streams");
    };
    if (content.creator != caller) {
      Runtime.trap("Unauthorized: Cannot create stream on behalf of another user");
    };
    streamedContent.add(content.id, content);
    content.id;
  };

  // Allow guests to browse streamed content
  public query func listStreams() : async [StreamedContent] {
    streamedContent.values().toArray().sort();
  };

  public shared ({ caller }) func clearMedia() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear media");
    };
    mediaFiles.clear();
  };

  public shared ({ caller }) func clearTutorials() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear tutorials");
    };

    // Collect all tutorial IDs and associated media files before clearing
    let tutorialIds = List.fromArray(tutorials.keys().toArray());
    let tutorialMediaFiles = List.fromArray(
      tutorials.values().toArray().map(func(t) { t.video.name })
    );

    // Clear tutorial metadata
    tutorials.clear();

    // Clear tutorial completion records for all users
    tutorialCompletions.clear();

    // Clear AI feedback storage for all tutorials
    aiFeedbackStorage.clear();

    // Remove tutorial video files from media storage (if not used elsewhere)
    for (mediaName in tutorialMediaFiles.values()) {
      if (not isPublicMedia(mediaName)) {
        mediaFiles.remove(mediaName);
      };
    };

    // Clean up user profiles - remove tutorial references from purchasedContent
    for ((principal, profile) in userProfiles.entries()) {
      let filteredPurchased = profile.purchasedContent.filter(
        func(contentId) {
          // Keep only non-tutorial content
          not tutorialIds.any(func(tutorialId) { tutorialId == contentId });
        }
      );

      // Clean up AI interaction history for deleted tutorials
      let filteredAIHistory = profile.aiInteractionHistory.filter(
        func(interaction) {
          not tutorialIds.any(func(tutorialId) { tutorialId == interaction.tutorialId });
        }
      );

      let updatedProfile : UserProfile = {
        profile with
        purchasedContent = filteredPurchased;
        aiInteractionHistory = filteredAIHistory;
      };
      userProfiles.add(principal, updatedProfile);
    };
  };

  // Store Integration (external)
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  // Public query - anyone can check if Stripe is configured
  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  public shared ({ caller }) func getStripeConfiguration() : async Stripe.StripeConfiguration {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view Stripe configuration");
    };
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    // Verify caller owns the session or is admin
    switch (stripeSessionOwners.get(sessionId)) {
      case (null) {
        // Session not found in our records
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Session not found or access denied");
        };
      };
      case (?owner) {
        if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own checkout sessions");
        };
      };
    };

    let config = switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
    await Stripe.getSessionStatus(config, sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    let config = switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
    let sessionId = await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
    // Track session ownership
    stripeSessionOwners.add(sessionId, caller);
    sessionId;
  };

  public shared ({ caller }) func getCallerAddress() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get caller address");
    };
    caller.toText();
  };

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public shared ({ caller }) func toggleAIAssistant(enabled : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle AI assistant");
    };
    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        let updatedProfile : UserProfile = {
          profile with
          aiAssistantEnabled = enabled;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func isAIAssistantEnabled(user : Principal) : async Bool {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own AI assistant settings");
    };
    switch (userProfiles.get(user)) {
      case (null) {
        false;
      };
      case (?profile) {
        profile.aiAssistantEnabled;
      };
    };
  };

  public shared query ({ caller }) func getAIFeedback(tutorialId : Text, timestamp : Nat) : async ?AIFeedback {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access AI feedback");
    };

    // Check if user has access to the tutorial
    if (not hasAccessToTutorial(caller, tutorialId)) {
      Runtime.trap("Unauthorized: You must purchase this tutorial to access AI feedback");
    };

    switch (aiFeedbackStorage.get(tutorialId)) {
      case (null) {
        null;
      };
      case (?feedbackList) {
        switch (feedbackList.find(func(f) { f.videoTimestamp == timestamp })) {
          case (null) { null };
          case (?feedback) { ?feedback };
        };
      };
    };
  };

  public shared ({ caller }) func updateAIFeedback(tutorialId : Text, feedback : Text, timestamp : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update AI feedback");
    };
    let newFeedback : AIFeedback = {
      tutorialId;
      videoTimestamp = timestamp;
      feedback;
    };
    let existingFeedback = switch (aiFeedbackStorage.get(tutorialId)) {
      case (null) { [] };
      case (?feedbackList) { feedbackList };
    };
    aiFeedbackStorage.add(tutorialId, existingFeedback.concat([newFeedback]));
  };

  public shared ({ caller }) func provideAIResponse(request : AIRequest) : async AIResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request AI responses");
    };

    // Check if user has access to the tutorial
    if (not hasAccessToTutorial(caller, request.tutorialId)) {
      Runtime.trap("Unauthorized: You must purchase this tutorial to access AI assistance");
    };

    switch (aiFeedbackStorage.get(request.tutorialId)) {
      case (null) {
        { feedback = "No feedback available for this tutorial and timestamp\n"; suggestions = [] };
      };
      case (?feedbackList) {
        let timestampCoreFeedback = feedbackList.filter(
          func(f) {
            f.videoTimestamp == request.videoTimestamp;
          }
        );
        if (timestampCoreFeedback.size() == 0) {
          { feedback = "No feedback available for this timestamp"; suggestions = [] };
        } else {
          { feedback = timestampCoreFeedback[0].feedback; suggestions = []; };
        };
      };
    };
  };

  public shared query ({ caller }) func getAIHistory(user : Principal, tutorialId : Text) : async [AIInteraction] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own AI history");
    };
    switch (userProfiles.get(user)) {
      case (null) {
        [];
      };
      case (?profile) {
        let interactionsList : Iter.Iter<AIInteraction> = profile.aiInteractionHistory.values();
        let filtered = interactionsList.filter(
          func(interaction) {
            interaction.tutorialId == tutorialId;
          }
        );
        filtered.toArray();
      };
    };
  };

  public query ({ caller }) func getUserProfiles() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all user profiles");
    };
    userProfiles.values().toArray();
  };

  public shared ({ caller }) func updateAIHistory(user : Principal, interaction : AIInteraction) : async () {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own AI history");
    };
    switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        let currentHistory = profile.aiInteractionHistory;
        let newArray = [interaction].concat(currentHistory);
        let updatedProfile : UserProfile = {
          profile with
          aiInteractionHistory = newArray;
        };
        userProfiles.add(user, updatedProfile);
      };
    };
  };

  // Allow guests to view tutorial metadata for browsing
  public query func getTutorial(tutorialId : Text) : async ?Tutorial {
    tutorials.get(tutorialId);
  };

  // Deletion Functionality

  public shared ({ caller }) func deleteMedia(id : Text) : async () {
    switch (mediaFiles.get(id)) {
      case (null) { Runtime.trap("Media file not found") };
      case (?mediaFile) {
        if (
          not AccessControl.isAdmin(accessControlState, caller) and
          (caller != mediaFile.uploader)
        ) {
          Runtime.trap("Unauthorized: Only admins or the uploader can delete this media file");
        };

        if (isPublicMedia(id)) {
          Runtime.trap("Cannot delete public media files directly. Please remove associated references first");
        };

        mediaFiles.remove(id);
      };
    };
  };

  public shared ({ caller }) func deleteTutorial(id : Text) : async () {
    switch (tutorials.get(id)) {
      case (null) { Runtime.trap("Tutorial not found") };
      case (?tutorial) {
        if (
          not AccessControl.isAdmin(accessControlState, caller) and
          (caller != tutorial.creator)
        ) {
          Runtime.trap("Unauthorized: Only admins or the creator can delete this tutorial");
        };

        // Remove media file associated with the tutorial
        let mediaId = tutorial.video.name;
        if (not isPublicMedia(mediaId)) {
          mediaFiles.remove(mediaId);
        };

        tutorials.remove(id);
      };
    };
  };

  public shared ({ caller }) func deletePost(id : Text) : async () {
    switch (communityPosts.get(id)) {
      case (null) { Runtime.trap("Community post not found") };
      case (?post) {
        if (
          not AccessControl.isAdmin(accessControlState, caller) and
          (caller != post.author)
        ) {
          Runtime.trap("Unauthorized: Only admins or the author can delete this post");
        };

        // Remove associated media files
        for (media in post.media.vals()) {
          if (not isPublicMedia(media.name)) {
            mediaFiles.remove(media.name);
          };
        };

        communityPosts.remove(id);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };

    switch (storeProducts.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        // Remove associated images only if not used by other products
        for (image in product.images.vals()) {
          // Check if this image is used by other products
          let usageCount = countProductsUsingImage(image.name);
          // If only used by this product (count will be 1), and not used elsewhere, remove it
          if (usageCount == 1 and not isPublicMedia(image.name)) {
            mediaFiles.remove(image.name);
          };
        };

        storeProducts.remove(id);
      };
    };
  };

  public shared ({ caller }) func deleteStream(id : Text) : async () {
    switch (streamedContent.get(id)) {
      case (null) { Runtime.trap("Streamed content not found") };
      case (?content) {
        if (
          not AccessControl.isAdmin(accessControlState, caller) and
          (caller != content.creator)
        ) {
          Runtime.trap("Unauthorized: Only admins or the creator can delete this content");
        };

        // Remove associated media file if not public
        if (not isPublicMedia(content.media.name)) {
          mediaFiles.remove(content.media.name);
        };

        streamedContent.remove(id);
      };
    };
  };

  // Chat Tutor Functions - Per-user chat history
  public shared ({ caller }) func sendChatMessage(message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send chat messages");
    };

    let newMessage : ChatMessage = {
      sender = "User";
      message;
      timestamp = Time.now();
      isAI = false;
    };

    let userHistory = switch (userChatHistories.get(caller)) {
      case (null) { List.empty<ChatMessage>() };
      case (?history) { history };
    };

    userHistory.add(newMessage);
    userChatHistories.add(caller, userHistory);
  };

  public shared ({ caller }) func sendAIChatResponse(message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can receive AI chat responses");
    };

    let newMessage : ChatMessage = {
      sender = "AI Tutor";
      message;
      timestamp = Time.now();
      isAI = true;
    };

    let userHistory = switch (userChatHistories.get(caller)) {
      case (null) { List.empty<ChatMessage>() };
      case (?history) { history };
    };

    userHistory.add(newMessage);
    userChatHistories.add(caller, userHistory);
  };

  public query ({ caller }) func getChatHistory() : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chat history");
    };

    switch (userChatHistories.get(caller)) {
      case (null) { [] };
      case (?history) {
        let iter = history.values();
        iter.toArray();
      };
    };
  };

  public shared ({ caller }) func clearChatHistory() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear their chat history");
    };
    userChatHistories.remove(caller);
  };
};
