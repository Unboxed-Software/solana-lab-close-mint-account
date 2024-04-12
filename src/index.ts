import { initializeKeypair } from '@solana-developers/helpers'
import { Connection, Keypair } from '@solana/web3.js'
import dotenv from 'dotenv'
dotenv.config()

/**
 * Create a connection and initialize a keypair if one doesn't already exists.
 * If a keypair exists, airdrop a sol if needed.
 */
const connection = new Connection("http://127.0.0.1:8899")
const payer = await initializeKeypair(connection)

console.log(`public key: ${payer.publicKey.toBase58()}`)

const mintKeypair = Keypair.generate()
const mint = mintKeypair.publicKey
console.log(
	'\nmint public key: ' + mintKeypair.publicKey.toBase58() + '\n\n'
)

// CREATE A MINT WITH CLOSE AUTHORITY

// MINT TOKEN

// VERIFY SUPPLY

// TRY CLOSING WITH NON ZERO SUPPLY

// BURN SUPPLY

// CLOSE MINT
