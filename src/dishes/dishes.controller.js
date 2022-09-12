const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//get validation middleware
function hasName(request, response, next) {
  const { data: { name } = {} } = request.body;
  if (name) {
    return next();
  }
  next({ status: 400, message: "Dish must include a name." });
}

function hasDescription(request, response, next) {
  const { data: { description } = {} } = request.body;
  if (description) {
    return next();
  }
  next({ status: 400, message: "Dish must include a description." });
}

function hasPrice(request, response, next) {
  const { data: { price } = {} } = request.body;
  if (price) {
    return next();
  }
  next({ status: 400, message: "Dish must include a price." });
}

//Validate that price is an integer
function dishIsInteger(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (Number.isInteger(price)) {
    return next();
  }
  return next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0",
  });
}

//Check that price is greater than 0
function dishPriceAmntCheck(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (Math.sign(price) > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0",
  });
}

function hasImage(request, response, next) {
  const { data: { image_url } = {} } = request.body;
  if (image_url) {
    return next();
  }
  next({ status: 400, message: "Dish must include an image_url." });
}

function dishIdExists(request, response, next) {
//   console.log("PARAMS", request.params)
  const { dishId } = request.params;
//   console.log("DISH ID", dishId, typeof dishId)
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    response.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id does not exist: ${dishId}`,
  });
}

function dishIdMatch(request, response, next) {
  const {dishId} = request.params;
  const { data: { id } = {} } = request.body;

  if (id) {
    if (id == Number(dishId)) {
      next();
    }
    next({
      status: 400,
      message: `Dish id does not exist: ${id}`,
    });
  }
  next();
}

// TODO: Implement the /dishes handlers needed to make the tests pass

//get request lists dishes
function list(request, response, next) {
  response.json({ data: dishes });
}

//post request creates dishes
function create(request, response, next) {
  const { data: { name, description, price, image_url } = {} } = request.body;
  // creates a new dish
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image: image_url,
  };
  dishes.push(newDish)
  response.status(201).json({ data: newDish });
}

//get request reads
function read(request, response, next) {
  response.json({ data: response.locals.dish });
}

//put request updates
function update(request, response) {
  const dish = response.locals.dish;

  const {
    data: { name, description, price, image_url },
  } = request.body;

  if (dish.name !== name) {
    dish.name = name;
  }
  if (dish.description !== description) {
    dish.description = description;
  }
  if (dish.price !== price) {
    dish.price = price;
  }
  if (dish.image_url !== image_url) {
    dish.image_url = image_url;
  }

  return response.json({ data: dish });
}

module.exports = {
  list,
  create: [
    hasName,
    hasDescription,
    hasImage,
    dishIsInteger,
    dishPriceAmntCheck,
    hasPrice,
    create,
  ],
    read: [dishIdExists, read],
  update: [
    dishIdExists,
    dishIdMatch,
    hasName,
    hasDescription,
    hasImage,
    dishIsInteger,
    dishPriceAmntCheck,
    hasPrice,
    update,
  ],
  dishIdExists,
};
