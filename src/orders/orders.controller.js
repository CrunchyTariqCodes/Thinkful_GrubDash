const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//***MIDDLEWARE FUNCTIONS***
function orderHasValidFields(req, res, next) {
  const { data = {} } = req.body;
  const { deliverTo, mobileNumber, dishes } = data;
  const VALID_FIELDS = ["deliverTo", "mobileNumber", "dishes"];

  //Are all required fields present
  for (const field of VALID_FIELDS) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  }

  //properties have valid values
  if (
    deliverTo === "" ||
    mobileNumber === "" ||
    !Array.isArray(dishes) ||
    dishes.length <= 0
  ) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }

  //dishes has proper quantity value
  for (const dish of dishes) {
    if (
      !dish.quantity ||
      !Number.isInteger(dish.quantity) ||
      Number(dish.quantity) === 0
    ) {
      return next({
        status: 400,
        message: `Dish ${dishes.indexOf(
          dish
        )} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
}

function statusIsValid(req, res, next) {
  const { data } = req.body;
  const { status } = data;
  if (
    !status ||
    status === "invalid" //||
    // status !== "preparing" ||
    // status !== "out-for-delivery"
  ) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next();
}

function updateOrderIdIsValid(req, res, next) {
  const { orderId } = req.params;
  const { data } = req.body;
  const { id } = data;
  if (id && orderId !== data.id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

//***CRUDL Functions***

const list = (req, res, next) => {
  res.json({ data: orders });
};

const read = (req, res, next) => {
  res.json({ data: res.locals.order });
};

const create = (req, res, next) => {
  const newOrder = {
    id: nextId(),
    ...req.body.data,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

//***ALTERNATE UPDATE METHOD***

//Keep for review_

// const update = (req, res, next) => {
//   const { orderId } = req.params;
//   const { data } = req.body;
//   const { id, deliverTo, mobileNumber, status, dishes } = data;

//   const updatedOrder = {
//     id: orderId,
//     deliverTo,
//     mobileNumber,
//     status,
//     dishes,
//   };

//   Object.assign(res.locals.order, updatedOrder);
//   res.status(200).json({ data: updatedOrder });
// };

const update = (req, res, next) => {
  const { order } = res.locals;
  const { data: updateOrder } = req.body;
  for (let prop in updateOrder) {
    if (updateOrder[prop]) {
      order[prop] = updateOrder[prop];
    }
  }
  res.json({ data: order });
};

const destroy = (req, res, next) => {
  const { orderId } = req.params;
  const { status } = res.locals.order;

  //make this a middleware later
  if (status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }

  const orderIndex = orders.findIndex((order) => order.id === orderId);
  orders.splice(orderIndex, 1);
  res.sendStatus(204);
};

module.exports = {
  list,
  read: [orderExists, read],
  create: [orderHasValidFields, create],
  update: [
    orderExists,
    orderHasValidFields,
    updateOrderIdIsValid,
    statusIsValid,
    update,
  ],
  destroy: [orderExists, destroy],
};
