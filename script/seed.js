'use strict'
const db = require('../server/db')
const {
  User,
  Transaction,
  Review,
  Product,
  Order
} = require('../server/db/models')
const userData = require('./data/users.json')
const reviewData = require('./data/reviews.json')
const productData = require('./data/artifacts.json')

const getIndex = l => Math.floor(Math.random() * l)

async function seed() {
  await db.sync({force: true})
  console.log('db synced!')

  const data = await Promise.all([
    Promise.all(userData.map(user => User.create(user))),
    Promise.all(reviewData.map(review => Review.create(review))),
    Promise.all(productData.map(review => Product.create(review)))
  ])

  const [users, reviews, products] = data

  await Promise.all(
    reviews.map(review => {
      return Promise.all([
        review.setUser(users[getIndex(users.length)]),
        review.setProduct(products[getIndex(products.length)])
      ])
    })
  )

  const [user1, user2] = users

  async function createOrder(status, user, items) {
    const order = await Order.create({
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      userId: user.id,
      status
    })

    const transactions = []
    let newTotal = 0

    for (let i = 0; i < items; i++) {
      const product = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 5) + 1
      const total = quantity * product.price
      newTotal += total
      const t = Transaction.create({
        status,
        price: product.price,
        userId: user.id,
        productId: product.id,
        orderId: order.id,
        quantity,
        total
      })

      transactions.push(t)
    }

    transactions.push(order.update({total: newTotal}))

    await Promise.all(transactions)
  }

  await Promise.all([
    createOrder('purchased', user1, 5),
    createOrder('purchased', user1, 5),
    createOrder('purchased', user1, 5),
    createOrder('purchased', user1, 5),
    createOrder('purchased', user1, 5),
    createOrder('purchased', user1, 5),
    createOrder('purchased', user1, 5),
    createOrder('purchased', user1, 5),
    createOrder('purchased', user2, 5),
    createOrder('purchased', user2, 5),
    createOrder('purchased', user2, 5),
    createOrder('purchased', user2, 5)
  ])

  await console.log(`seeded ${users.length} users`)
  console.log(`seeded successfully`)
}

// We've separated the `seed` function from the `runSeed` function.
// This way we can isolate the error handling and exit trapping.
// The `seed` function is concerned only with modifying the database.
async function runSeed() {
  console.log('seeding...')
  try {
    await seed()
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  } finally {
    console.log('closing db connection')
    await db.close()
    console.log('db connection closed')
  }
}

// Execute the `seed` function, IF we ran this module directly (`node seed`).
// `Async` functions always return a promise, so we can use `catch` to handle
// any errors that might occur inside of `seed`.
if (module === require.main) {
  runSeed()
}

// we export the seed function for testing purposes (see `./seed.spec.js`)
module.exports = seed
