import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Token "token";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type OldMediaFile = {
    name : Text;
    contentType : Text;
    uploader : Text;
  };

  type OldTokenSystem = {
    balances : Map.Map<Text, Nat>;
    transactionHistories : Map.Map<Text, List.List<Token.TokenTransaction>>;
  };

  type ChatMessage = {
    sender : Text;
    message : Text;
    timestamp : Time.Time;
    isAI : Bool;
  };

  type OldActor = {
    tutorialCompletions : Map.Map<Text, Map.Map<Text, Bool>>;
    oldTokenSystem : OldTokenSystem;
    aiFeedbackStorage : Map.Map<Text, [Token.TokenTransaction]>;
    stripeSessionOwners : Map.Map<Text, Text>;
    chatMessages : List.List<Text>;
    isChatOpen : Bool;
    chatTutorStatus : Bool;
    chatHistory : List.List<ChatMessage>;
  };

  type NewActor = {
    tutorialCompletions : Map.Map<Text, Map.Map<Text, Bool>>;
    aiFeedbackStorage : Map.Map<Text, [Token.TokenTransaction]>;
    stripeSessionOwners : Map.Map<Text, Text>;
    userChatHistories : Map.Map<Principal, List.List<ChatMessage>>;
  };

  public func run(old : OldActor) : NewActor {
    let userChatHistories : Map.Map<Principal, List.List<ChatMessage>> = Map.empty<Principal, List.List<ChatMessage>>();
    {
      tutorialCompletions = old.tutorialCompletions;
      aiFeedbackStorage = old.aiFeedbackStorage;
      stripeSessionOwners = old.stripeSessionOwners;
      userChatHistories;
    };
  };
};
