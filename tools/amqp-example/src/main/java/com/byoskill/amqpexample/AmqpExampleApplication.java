package com.byoskill.amqpexample;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@EnableAutoConfiguration
@SpringBootApplication
public class AmqpExampleApplication {

	public static void main(String[] args) {
		SpringApplication.run(AmqpExampleApplication.class, args);
	}

	@Value("${my.application.exchange}")
	private String topicExchangeName = "java-example";

	@Value("${my.application.queue}")
	private String queueName = "java-queue";

	@Value("${my.application.routing}")
	private String routingKey = "example";

	@Value("${rabbitmq.host}")
	private String rabbitHost = "localhost";

	@Value("${rabbitmq.username}")
	private String rabbitUsername = "guest";

	@Value("${rabbitmq.password}")
	private String rabbitPassword = "guest";

	@Bean
	public CachingConnectionFactory connectionFactory() {
		final var connection = new CachingConnectionFactory();
		connection.setAddresses(rabbitHost);
		connection.setUsername(rabbitUsername);
		connection.setPassword(rabbitPassword);
		return connection;
	}

	@Bean
	Queue queue() {
		return new Queue(queueName, false);
	}

	@Bean
	TopicExchange exchange() {
		return new TopicExchange(topicExchangeName);
	}

	@Bean
	Binding binding(Queue queue, TopicExchange exchange) {
		return BindingBuilder.bind(queue).to(exchange).with(routingKey);
	}

	@Bean
	SimpleMessageListenerContainer container(ConnectionFactory connectionFactory,
			MessageListenerAdapter listenerAdapter) {
		SimpleMessageListenerContainer container = new SimpleMessageListenerContainer();
		container.setConnectionFactory(connectionFactory);
		container.setQueueNames(queueName);
		container.setMessageListener(listenerAdapter);
		return container;
	}

	@Bean
	MessageListenerAdapter listenerAdapter(Receiver receiver) {
		return new MessageListenerAdapter(receiver, "receiveMessage");
	}

}
