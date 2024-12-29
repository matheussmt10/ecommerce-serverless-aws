
# E-commerce Serverless AWS

Este projeto foi desenvolvido para consolidar os conhecimentos adquiridos em um curso sobre os produtos da AWS, implementando uma aplicação de e-commerce utilizando uma arquitetura serverless.

## Serviços AWS Utilizados

Este projeto faz uso dos seguintes serviços da AWS:

- **AWS Lambda**: Para execução de funções serverless que compõem a lógica de negócio da aplicação.
- **Amazon API Gateway**: Para expor as APIs RESTful que permitem a comunicação entre os clientes e os microserviços.
- **Amazon DynamoDB**: Utilizado como banco de dados NoSQL para armazenamento de dados da aplicação.
- **Amazon EventBridge**: Para orquestração de eventos entre os microserviços de forma assíncrona.
- **AWS Identity and Access Management (IAM)**: Para gerenciamento de permissões e segurança dos recursos utilizados.
- **AWS CloudFormation**: Para provisionamento e gerenciamento da infraestrutura como código, facilitando a replicação e manutenção do ambiente.
- **Amazon CloudWatch**: Para monitoramento e logging das funções Lambda e outros recursos da aplicação.
- **AWS X-Ray**: Para rastreamento e depuração de solicitações na aplicação, auxiliando na identificação de gargalos e problemas de performance.

## Pré-requisitos

- [Node.js](https://nodejs.org/)
- [AWS CLI](https://aws.amazon.com/cli/) configurado com as credenciais apropriadas
- [AWS CDK](https://aws.amazon.com/cdk/) instalado globalmente

## Configuração do Projeto

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/matheussmt10/ecommerce-serverless-aws.git
   cd ecommerce-serverless-aws
   ```

2. **Instale as dependências:**

   ```bash
   yarn install
   ```

3. **Compile o projeto:**

   ```bash
   yarn build
   ```

## Implantação

1. **Verifique as diferenças entre o estado atual e o que será implantado:**

   ```bash
   cdk diff
   ```

2. **Implante a infraestrutura na AWS:**

   ```bash
   cdk deploy
   ```

## Estrutura do Projeto

- `/bin`: Contém o arquivo de entrada para a aplicação CDK.
- `/lib`: Contém as definições das stacks do CDK.
- `/lambda`: Contém o código das funções Lambda.

## Recursos Adicionais

Para aprofundar seu conhecimento sobre arquiteturas serverless para e-commerce na AWS, considere os seguintes recursos:

- [AWS Serverless Ecommerce Platform](https://github.com/aws-samples/aws-serverless-ecommerce-platform)
- [Arquitetando um Site de E-commerce Altamente Disponível e Serverless](https://aws.amazon.com/blogs/architecture/architecting-a-highly-available-serverless-microservices-based-ecommerce-site/)
- [Implementando Arquitetura Serverless na AWS para E-commerce](https://www.youtube.com/watch?v=jRTJ1n-DyQY)

## Licença

Este projeto está licenciado sob a Licença MIT.
