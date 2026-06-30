import { KafkaConnector } from "../index";

describe("connector-kafka", () => {
  let instance: KafkaConnector;

  beforeEach(() => {
    instance = new KafkaConnector({
      brokers: ["localhost:9092"],
      clientId: "test-client",
    });
  });

  test("should initialize", () => {
    expect(instance).toBeDefined();
  });

  test("should have basic functionality", () => {
    expect(typeof instance).toBe("object");
  });
});
