export interface BlockchainError {
  message: string | {
    message:  string
    errorCode: string
    statusCode: number
  }
  response?: {
    data: string
  }
}
