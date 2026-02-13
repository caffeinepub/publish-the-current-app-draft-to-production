import Nat "mo:core/Nat";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

module {
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

  public type TokenSystem = {
    balances : Map.Map<Principal, Nat>;
    transactionHistories : Map.Map<Principal, List.List<TokenTransaction>>;
  };

  public func init() : TokenSystem {
    {
      balances = Map.empty<Principal, Nat>();
      transactionHistories = Map.empty<Principal, List.List<TokenTransaction>>();
    };
  };

  func getNonNullTransactionHistory(history : ?List.List<TokenTransaction>) : List.List<TokenTransaction> {
    switch (history) {
      case (null) { List.empty<TokenTransaction>() };
      case (?h) { h };
    };
  };

  public func mintTokens(tokenSystem : TokenSystem, recipient : Principal, amount : Nat, description : Text, minter : ?Principal) {
    let balance = switch (tokenSystem.balances.get(recipient)) {
      case (null) { 0 };
      case (?b) { b };
    };

    tokenSystem.balances.add(recipient, balance + amount);

    let history = getNonNullTransactionHistory(tokenSystem.transactionHistories.get(recipient));
    let transaction : TokenTransaction = {
      from = minter;
      to = ?recipient;
      amount;
      description;
      timestamp = Time.now();
      transactionType = #mint;
    };
    history.add(transaction);
    tokenSystem.transactionHistories.add(recipient, history);
  };

  public func transferTokens(tokenSystem : TokenSystem, from : Principal, to : Principal, amount : Nat, description : Text) {
    let fromBalance = switch (tokenSystem.balances.get(from)) {
      case (null) { 0 };
      case (?b) { b };
    };

    if (fromBalance < amount) {
      Runtime.trap("Insufficient balance");
    };

    let toBalance = switch (tokenSystem.balances.get(to)) {
      case (null) { 0 };
      case (?b) { b };
    };

    tokenSystem.balances.add(from, fromBalance - amount);
    tokenSystem.balances.add(to, toBalance + amount);

    let fromHistory = getNonNullTransactionHistory(tokenSystem.transactionHistories.get(from));
    let toHistory = getNonNullTransactionHistory(tokenSystem.transactionHistories.get(to));

    let transaction : TokenTransaction = {
      from = ?from;
      to = ?to;
      amount;
      description;
      timestamp = Time.now();
      transactionType = #transfer;
    };

    fromHistory.add(transaction);
    toHistory.add(transaction);

    tokenSystem.transactionHistories.add(from, fromHistory);
    tokenSystem.transactionHistories.add(to, toHistory);
  };

  public func getBalance(tokenSystem : TokenSystem, user : Principal) : Nat {
    switch (tokenSystem.balances.get(user)) {
      case (null) { 0 };
      case (?balance) { balance };
    };
  };

  public func getTransactionHistory(tokenSystem : TokenSystem, user : Principal) : [TokenTransaction] {
    let history = getNonNullTransactionHistory(tokenSystem.transactionHistories.get(user));
    history.toArray();
  };

  public func spendTokens(tokenSystem : TokenSystem, user : Principal, amount : Nat, description : Text) {
    let balance = switch (tokenSystem.balances.get(user)) {
      case (null) { 0 };
      case (?b) { b };
    };

    if (balance < amount) {
      Runtime.trap("Insufficient balance to spend");
    };

    tokenSystem.balances.add(user, balance - amount);

    let history = getNonNullTransactionHistory(tokenSystem.transactionHistories.get(user));
    let transaction : TokenTransaction = {
      from = ?user;
      to = null;
      amount;
      description;
      timestamp = Time.now();
      transactionType = #spend;
    };
    history.add(transaction);
    tokenSystem.transactionHistories.add(user, history);
  };

  public func recordEarning(tokenSystem : TokenSystem, user : Principal, amount : Nat, description : Text) {
    let balance = switch (tokenSystem.balances.get(user)) {
      case (null) { 0 };
      case (?b) { b };
    };

    tokenSystem.balances.add(user, balance + amount);

    let history = getNonNullTransactionHistory(tokenSystem.transactionHistories.get(user));
    let transaction : TokenTransaction = {
      from = null;
      to = ?user;
      amount;
      description;
      timestamp = Time.now();
      transactionType = #earn;
    };
    history.add(transaction);
    tokenSystem.transactionHistories.add(user, history);
  };
};
