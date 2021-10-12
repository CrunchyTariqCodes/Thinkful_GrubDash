const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function bodyHasAllProperties(req, res, next) {
  const { data = {} } = req.body;
  const { name, description, price, image_url } = data;
  if (
    name &&
    name.length > 0 &&
    description &&
    price &&
    price > 0 &&
    typeof price === "number" &&
    image_url &&
    image_url.length > 0 
  ) {
    res.locals.name = name;
    res.locals.description = description;
    res.locals.price = price;
    res.locals.image_url = image_url;
    return next();
  }
  next({
    status: 400,
    message: `A name, description, price, and image_url property are all required`,
  });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}


const list = (req, res, next) => {
  res.json({ data: dishes });
};

const create = (req, res, next) => {
  const newDish = {
    id: nextId(),
    ...req.body.data,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};

const read = (req, res, next) => {
  res.json({ data: res.locals.dish });
};

const update = (req, res, next) => {
  const { dishId } = req.params;
  const { data = {} } = req.body;
  const { id, name, description, price, image_url } = data;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Data id field ${id} does not match route id: ${req.originalUrl} `,
    });
  }

  const updatedDish = {
    id: dishId,
    name,
    description,
    price,
    image_url,
  };

  const dish = dishes.find((dish) => dish.id === dishId);
  Object.assign(dish, updatedDish);

  res.status(200).json({ data: updatedDish });
};

module.exports = {
  list,
  read: [dishExists, read],
  create: [bodyHasAllProperties, create],
  update: [dishExists, bodyHasAllProperties, update],
};
