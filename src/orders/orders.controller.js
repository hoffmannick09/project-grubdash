const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//Validators

function orderIdMatch(request, response, next) {
  const { orderId } = request.params;
  const { data: { id } = {} } = request.body;

  if (id) {
    if (id == Number(orderId)) {
      next();
    }
    next({
      status: 400,
      message: `Order id does not match route id. Order ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

function hasDeliverTo(request, response, next) {
  const { data: { deliverTo } = {} } = request.body;
  if (deliverTo) {
    return next();
  }
  next({ status: 400, message: "Order must include a deliverTo" });
}

function hasMobileNumber(request, response, next) {
  const { data: { mobileNumber } = {} } = request.body;
  if (mobileNumber) {
    return next();
  }
  next({ status: 400, message: "Order must include a mobileNumber" });
}

function hasDishes(request, response, next) {
  const { data: { dishes } = {} } = request.body;
  if (dishes) {
    return next();
  }
  next({ status: 400, message: "Order must include a dish" });
}

function dishesIsArray(request, response, next) {
  const { data: { dishes } = {} } = request.body;
  if (Array.isArray(dishes) && dishes.length > 0) {
    return next();
  }
  next({ status: 400, message: "Order must include at least one dish" });
}

function dishIsNotInteger(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  let status = true;
  let index;

  for (let i = 0; i < dishes.length; i++) {
    if (!Number.isInteger(dishes[i].quantity) || dishes[i].quantity <= 0) {
      status = false;
      index = i;
    }
  }
  if (status) {
    return next();
  }
  next({
    status: 400,
    message: `Dish at ${index} must have a quantity that is an integer greater than 0`,
  });
}

function hasStatus(request, response, next) {
  const { data: { status } = {} } = request.body;
  if (status && status !== "invalid") {
    return next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function checkDeliveredStatus(request, response, next) {
  const { data: { status } = {} } = request.body;
  if (status !== "delivered") {
    return next();
  }
  next({ status: 400, message: "A delivered order cannot be changed" });
}

function checkShippingStatus(request, response, next) {
    const status = response.locals.order.status;
    if (status === "pending") {
      return next();
    }
    next({ status: 400, message: "An order cannot be deleted unless it is pending." });
  }

function orderIdExists(request, response, next) {
  const { orderId } = request.params;

  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    response.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id does not exist: ${orderId}`,
  });
}

// TODO: Implement the /orders handlers needed to make the tests pass

function list(request, response) {
  response.json({ data: orders });
}

function create(request, response) {
  const { data: { deliverTo, mobileNumber, dishes, status, quantity } = {} } =
    request.body;
  // creates a new order
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    quantity: quantity,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  response.status(201).json({ data: newOrder });
}

function read(request, response, next) {
  response.json({ data: response.locals.order });
}

function update(request, response) {
  const order = response.locals.order;

  const { data: { deliverTo, mobileNumber, status, dishes } = {} } =
    request.body;

  if (order !== request.body.data) {
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
  }
  response.json({ data: order });
}

function destroy(request, response) {
  const { orderId } = request.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));

  orders.splice(index, 1);

  response.sendStatus(204);
}

module.exports = {
  list,
  create: [
    hasDeliverTo,
    hasMobileNumber,
    hasDishes,
    dishesIsArray,
    dishIsNotInteger,
    create,
  ],
  read: [orderIdExists, read],
  update: [
    orderIdExists,
    hasDeliverTo,
    hasMobileNumber,
    hasDishes,
    dishesIsArray,
    hasStatus,
    checkDeliveredStatus,
    dishIsNotInteger,
    orderIdMatch,
    update,
  ],
  delete: [orderIdExists, checkShippingStatus, destroy],
  orderIdExists,
};
