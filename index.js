//SARA AGOSTINI-GUERRERA || FINAL PROJECT - PART TWP
//12-10-20
const express = require("express");
const app = express();
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

let bodyParser = require("body-parser");
app.use(bodyParser.raw({ type: "*/*" }));

let morgan = require("morgan");
app.use(morgan("combined"));

let cors = require("cors");
app.use(cors());

let passwords = new Map();
let tokens = new Map();
let tokenID = 1011067824;
let sellingListings = new Map();
let buyersCart = new Map();
let buyersHistory = new Map();
let sellingItems = new Map();
let itemsShipped = new Map();
let allSelling = new Map();
let messages = new Map();
let reviews = new Map();
let itemReviews = new Map();
let sellingItemID = 1235;
let getItemID = () => {
  sellingItemID++;
  return "id" + sellingItemID;
};

//SOURCECODE ENDPOINT
app.get("/sourcecode", (req, res) => {
  res.send(
    require("fs")
      .readFileSync(__filename)
      .toString()
  );
});

// SIGNUP ENDPOINT
app.post("/signup", (req, res) => {
  let parsed = JSON.parse(req.body);
  let username = parsed.username;
  let password = parsed.password;

  console.log("password", password);

  if (passwords.has(username)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Username exists"
      })
    );
    return;
  }

  if (password == null) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "password field missing"
      })
    );
    return;
  }

  if (username == null) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "username field missing"
      })
    );
    return;
  }

  if (!buyersCart.has(username)) {
    buyersCart.set(username, []);
  }

  if (!buyersHistory.has(username)) {
    buyersHistory.set(username, []);
  }

  passwords.set(username, password);

  res.send(
    JSON.stringify({
      success: true
    })
  );
});

//LOGIN ENDPOINT
app.post("/login", (req, res) => {
  let parsed = JSON.parse(req.body);
  let username = parsed.username;
  let actualPassword = parsed.password;
  let expectedPassword = passwords.get(username);

  if (actualPassword == null) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "password field missing"
      })
    );
    return;
  }

  if (username == null) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "username field missing"
      })
    );
    return;
  }

  if (!passwords.has(username)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "User does not exist"
      })
    );
    return;
  }

  if (actualPassword !== expectedPassword) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid password"
      })
    );
    return;
  }

  let token = "some random token" + tokenID;
  res.send(JSON.stringify({ success: true, token: token }));

  tokens.set(token, username);
  tokenID++;
});

//CHANGE PASSWORD ENDPOINT
app.post("/change-password", (req, res) => {
  let parsed = JSON.parse(req.body);
  let header = req.headers;
  let token = header.token;
  let oldPassword = parsed.oldPassword;
  let username = tokens.get(token);
  let password = passwords.get(username);
  let newPassword = parsed.newPassword;

  if (token === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "token field missing"
      })
    );
    return;
  } else if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  } else if (oldPassword !== password) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Unable to authenticate"
      })
    );
    return;
  }

  passwords.set(username, newPassword);

  res.send(
    JSON.stringify({
      success: true
    })
  );
});

//CREATE LISTING ENDPOINT
app.post("/create-listing", (req, res) => {
  let parsed = JSON.parse(req.body);
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);
  let sellingPrice = parsed.price;
  let sellingDescription = parsed.description;

  if (token === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "token field missing"
      })
    );
    return;
  } else if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  } else if (sellingPrice === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "price field missing"
      })
    );
    return;
  } else if (sellingDescription === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "description field missing"
      })
    );
    return;
  }

  if (!sellingItems.has(username)) {
    sellingItems.set(username, []);
  }
  if (!itemsShipped.has(username)) {
    itemsShipped.set(username, []);
  }
  if (!reviews.has(username)) {
    reviews.set(username, []);
  }

  let sellingList = sellingItems.get(username);
  let itemID = getItemID();
  let item = {
    price: sellingPrice,
    description: sellingDescription,
    seller: username
  };
  let toSell = {
    price: sellingPrice,
    description: sellingDescription,
    seller: username,
    itemId: itemID
  };

  sellingListings.set(itemID, item);
  allSelling.set(itemID, item);
  sellingList.push(toSell);

  res.send(
    JSON.stringify({
      success: true,
      listingId: itemID
    })
  );
});

//LISTING ENDPOINT
app.get("/listing", (req, res) => {
  let query = req.query;
  let itemID = query.listingId;

  if (!sellingListings.has(itemID)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid listing id"
      })
    );
    return;
  }

  let item = sellingListings.get(itemID);
  let price = item.price;
  let desc = item.description;
  let seller = item.seller;

  res.send(
    JSON.stringify({
      success: true,
      listing: {
        price: price,
        description: desc,
        itemId: itemID,
        sellerUsername: seller
      }
    })
  );
});

//MOIDIFY LISTING ENDPOINT
app.post("/modify-listing", (req, res) => {
  let parsed = JSON.parse(req.body);
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);
  let itemID = parsed.itemid;
  let listedItems = sellingItems.get(username);

  if (token === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "token field missing"
      })
    );
    return;
  } else if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  } else if (itemID === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "itemid field missing"
      })
    );
    return;
  }

  let item = sellingListings.get(itemID);
  let price = item.price;
  let desc = item.description;

  if (parsed.price !== undefined) {
    price = parsed.price;
  } else if (parsed.description !== undefined) {
    desc = parsed.description;
  }

  let modification = { price: price, description: desc, seller: username };

  sellingListings.set(itemID, modification);
  allSelling.set(itemID, modification);

  let sellingMod = {
    price: price,
    description: desc,
    sellerUsername: username,
    itemId: itemID
  };
  for (let i = 0; i < listedItems.length; i++) {
    if (listedItems[i].itemId == itemID) {
      listedItems.splice(i, 1, sellingMod);
    }
  }

  res.send(
    JSON.stringify({
      success: true
    })
  );
});

//ADD TO CART ENDPOINT
app.post("/add-to-cart", (req, res) => {
  let parsed = JSON.parse(req.body);
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);
  let itemID = parsed.itemid;
  let cart = buyersCart.get(username);

  if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  } else if (itemID === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "itemid field missing"
      })
    );
    return;
  } else if (!sellingListings.has(itemID)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Item not found"
      })
    );
    return;
  }

  let item = sellingListings.get(itemID);
  let itemPrice = item.price;
  let itemDesc = item.description;
  let itemSeller = item.seller;

  cart.push({
    price: itemPrice,
    description: itemDesc,
    itemId: itemID,
    sellerUsername: itemSeller
  });

  res.send(
    JSON.stringify({
      success: true
    })
  );
});

//CART ENDPOINT
app.get("/cart", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);
  let cart = buyersCart.get(username);

  if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  }

  res.send(
    JSON.stringify({
      success: true,
      cart: cart
    })
  );
});

//CHECKOUT ENDPOINT
app.post("/checkout", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);
  let cart = buyersCart.get(username);
  let history = buyersHistory.get(username);

  if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  } else if (cart.length === 0) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Empty cart"
      })
    );
    return;
  }

  for (let i = 0; i < cart.length; i++) {
    if (!sellingListings.has(cart[i].itemId)) {
      res.send(
        JSON.stringify({
          success: false,
          reason: "Item in cart no longer available"
        })
      );
      return;
    } else {
      sellingListings.delete(cart[i].itemId);
    }
  }

  Array.prototype.push.apply(history, cart);
  cart = [];

  res.send(
    JSON.stringify({
      success: true
    })
  );
});

//PURCHASE HISTORY ENDPOINT
app.get("/purchase-history", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);
  let history = buyersHistory.get(username);

  if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  }

  res.send(
    JSON.stringify({
      success: true,
      purchased: history
    })
  );
});

//CHAT ENDPOINT
app.post("/chat", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);

  console.log("body: " + JSON.stringify(req.body));

  let parsed;
  let receiver;
  let message;

  if (JSON.stringify(req.body) !== JSON.stringify({})) {
    parsed = JSON.parse(req.body);
    receiver = parsed.destination;
    message = parsed.contents;
  }

  if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  } else if (receiver === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "destination field missing"
      })
    );
    return;
  } else if (message === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "contents field missing"
      })
    );
    return;
  } else if (!passwords.has(receiver)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Destination user does not exist"
      })
    );
    return;
  }

  if (!messages.has(username + receiver || receiver + username)) {
    messages.set(username + receiver, []);
    messages.set(receiver + username, []);
  }

  let messageGet1 = messages.get(username + receiver);
  let messageGet2 = messages.get(receiver + username);
  let msg = { from: username, contents: message };

  console.log(
    "First Array: " +
      messageGet1 +
      " " +
      "Second Array: " +
      messageGet2 +
      " " +
      "Messages: " +
      msg
  );

  messageGet1.push(msg);
  messageGet2.push(msg);

  res.send(
    JSON.stringify({
      success: true
    })
  );
});

//CHAT MESSAGES ENDPOINT
app.post("/chat-messages", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);

  let parsed;
  let receiver;
  let message;

  if (JSON.stringify(req.body) !== JSON.stringify({})) {
    parsed = JSON.parse(req.body);
    receiver = parsed.destination;
    message = parsed.contents;
  }

  let messageList = messages.get(username + receiver);

  if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  } else if (receiver === undefined) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "destination field missing"
      })
    );
    return;
  } else if (!passwords.has(receiver)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Destination user not found"
      })
    );
    return;
  }

  res.send(
    JSON.stringify({
      success: true,
      messages: messageList
    })
  );
});

//SHIP ENDPOINT
app.post("/ship", (req, res) => {
  let parsed = JSON.parse(req.body);
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);
  let itemID = parsed.itemid;
  let shippedOut = itemsShipped.get(username);

  if (sellingListings.has(itemID)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Item was not sold"
      })
    );
    return;
  } else if (shippedOut.includes(itemID)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Item has already shipped"
      })
    );
    return;
  } else if (allSelling.get(itemID).seller !== username) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "User is not selling that item"
      })
    );
    return;
  }

  shippedOut.push(itemID);

  res.send(
    JSON.stringify({
      success: true
    })
  );
});

//STATUS ENDPOINT
app.get("/status", (req, res) => {
  let query = req.query;
  let itemID = query.itemid;
  let item = allSelling.get(itemID);
  let seller = item.seller;
  let shipped = itemsShipped.get(seller);

  if (sellingListings.has(itemID)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Item not sold"
      })
    );
    return;
  }

  if (shipped.includes(itemID)) {
    res.send(
      JSON.stringify({
        success: true,
        status: "shipped"
      })
    );
  } else {
    res.send(
      JSON.stringify({
        success: true,
        status: "not-shipped"
      })
    );
  }
});

//REVIEW SELLER ENDPOINT
app.post("/review-seller", (req, res) => {
  let parsed = JSON.parse(req.body);
  let header = req.headers;
  let token = header.token;
  let username = tokens.get(token);
  let reviewStars = parsed.numStars;
  let reviewInfo = parsed.contents;
  let itemID = parsed.itemid;
  let item = allSelling.get(itemID);
  let seller = item.seller;
  let history = buyersHistory.get(username);
  let reviewList = reviews.get(seller);

  console.log("item: " + JSON.stringify(item));
  console.log("seller: " + seller);

  if (!tokens.has(token)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Invalid token"
      })
    );
    return;
  } else if (itemReviews.has(itemID)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "This transaction was already reviewed"
      })
    );
    return;
  } else if (
    !allSelling.has(itemID) ||
    !history.some(item => item.itemId === itemID)
  ) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "User has not purchased this item"
      })
    );
    return;
  }

  let review = {
    from: username,
    numStars: reviewStars,
    contents: reviewInfo
  };
  reviewList.push(review);
  itemReviews.set(itemID, reviews);

  res.send({
    success: true
  });
});

//REVIEWS ENDPOINT
app.get("/reviews", (req, res) => {
  let query = req.query;
  let seller = query.sellerUsername;
  let reviewList = reviews.get(seller);

  res.send({
    success: true,
    reviews: reviewList
  });
});

//SELLING ENDPOINT
app.get("/selling", (req, res) => {
  let query = req.query;
  let seller = query.sellerUsername;
  let itemList = sellingItems.get(seller);
  
  if(seller === undefined){
    res.send({
      success: false,
      reason: 'sellerUsername field missing'
    });
    return;
  }
  
  res.send(
    JSON.stringify({
      success: true,
      selling: itemList
    })
  );
});
