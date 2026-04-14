/* eslint-disable prettier/prettier */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // eslint-disable-next-line prettier/prettier
    origin: "*",
    methods: "GET,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Accept, Authorization",
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle("Docgen App")
    .setDescription("Docgen App APIs")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT bearer token",
        in: "header",
      },
      "access-token", // This is the name used in swagger to refer to this security scheme
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);
  await app.listen(3001, "0.0.0.0");
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
