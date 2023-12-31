import { faker } from "@faker-js/faker"
import "dotenv/config"
import slugify from "slugify"
import { hashUtils } from "~/auth/hash-utils"
import {
    createPost,
    type TCreatePost,
} from "~/src/server/use-cases/posts/create-post"
import {
    createUser,
    type TCreateUser,
} from "~/src/server/use-cases/users/create-user"
import { calculateReadingTime } from "~/src/utils/read-time"
import { ulid } from "~/src/utils/ulid"

async function seedPosts(n: number) {
    const user: TCreateUser = {
        id: ulid(),
        email: faker.internet.email(),
        name: faker.internet.userName(),
        image: faker.internet.avatar(),
        hashedPassword: await hashUtils.hashPassword(faker.internet.password()),
    }

    const author = await createUser(user)

    for (let i = 0; i < n; i++) {
        const title = faker.lorem.sentence()
        const body = faker.lorem.paragraphs()

        const post: TCreatePost = {
            id: ulid(),
            title,
            body,
            slug: slugify(title, { lower: true }),
            description: faker.lorem.sentences(),
            estimatedReadTime: calculateReadingTime(body),
            authorId: author.id,
        }

        await createPost(post)
    }
}

const n = parseInt(process.argv[2] ?? "10")

console.log("Seeding posts...")
seedPosts(n)
    .then(() => {
        console.log(`Seeded ${n} posts`)
        process.exit(0)
    })
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
