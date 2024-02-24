import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate';

import { sign } from 'hono/jwt'

const app = new Hono<{
	Bindings:{
		DATASOURCE_URL:string,
		JWT_TOKEN:string
	}
}>
();

app.get('/', (c) => {
	return c.text("hello world!");
});

app.get('/api/v1/signup', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATASOURCE_URL
	}).$extends(withAccelerate());

	const body = await c.req.json();

	let user = await prisma.user.findUnique({
		where: {
			email:body.email
		}
	})
	
	if(!user) {
		user = await prisma.user.create({
			data: {
				email: body.email,
				password: body.password
			}
		});
	}
	else {
		return c.json({msg:"User already exists!"})
	}

	const payload = {
		id: user.id,
		email: user.email,
		name: user.name
	}
	const token = await sign(payload, c.env.JWT_TOKEN)
	return c.json({
		jwt:token
	});
});

export default app;
