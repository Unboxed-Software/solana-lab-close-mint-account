import {
	Cluster,
	Connection,
	clusterApiUrl,
	Keypair,
	LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import {initializeKeypair} from './keypair-helpers'
import {createClosableMint} from './create-mint'
import {mintToken} from './mint-token'
import {
	TOKEN_2022_PROGRAM_ID,
	burn,
	closeAccount,
	getAccount,
	getMint,
} from '@solana/spl-token'
import printTableData from './print-helpers'

const CLUSTER: Cluster = 'devnet'

async function main() {
	/**
	 * Create a connection and initialize a keypair if one doesn't already exists.
	 * If a keypair exists, airdrop a sol if needed.
	 */
	const connection = new Connection('http://127.0.0.1:8899')
	const payer = await initializeKeypair(connection)

	console.log(`public key: ${payer.publicKey.toBase58()}`)

	const mintKeypair = Keypair.generate()
	console.log('\nmint public key: ' + mintKeypair.publicKey.toBase58())

	/**
	 * Creating a mint with close authority
	 */
	console.log()
	const decimals = 9

	await createClosableMint(CLUSTER, connection, payer, mintKeypair, decimals)

	/**
	 * Creating an account and mint 1 token to that account
	 */
	console.log()
	const sourceKeypair = Keypair.generate()
	const sourceAccount = await mintToken(
		connection,
		payer,
		mintKeypair.publicKey,
		sourceKeypair.publicKey
	)

	/**
	 * Get mint information to verify supply
	 */
	const mintInfo = await getMint(
		connection,
		mintKeypair.publicKey,
		'finalized',
		TOKEN_2022_PROGRAM_ID
	)
	printTableData(mintInfo)

	/**
	 * Try closing the mint account when supply is not 0
	 *
	 * Should throw `SendTransactionError`
	 */
	// try {
	// 	await closeAccount(
	// 		connection,
	// 		payer,
	// 		mintKeypair.publicKey,
	// 		payer.publicKey,
	// 		payer,
	// 		[],
	// 		{commitment: 'finalized'},
	// 		TOKEN_2022_PROGRAM_ID
	// 	)
	// } catch (e) {
	// 	console.log('Error closing mint account: ', e), '\n'
	// }

	const sourceAccountInfo = await getAccount(
		connection, 
		sourceAccount, 
		'finalized',
		TOKEN_2022_PROGRAM_ID
	)
	console.log('Source account info:')
	console.log(sourceAccountInfo)

	const burnSignature = await burn(
		connection,
		payer,
		sourceAccount,
		mintKeypair.publicKey,
		sourceKeypair,
		sourceAccountInfo.amount,
		[],
		{commitment: 'finalized'},
		TOKEN_2022_PROGRAM_ID
	)
	console.log(
		`Check the transaction at: https://explorer.solana.com/tx/${burnSignature}?cluster=${CLUSTER}`
	)

	/**
	 * Try closing the mint account when supply is 0
	 */
	try {

		const mintInfo = await getMint(
			connection, 
			mintKeypair.publicKey, 
			'finalized',
			TOKEN_2022_PROGRAM_ID
		)
	
		printTableData(mintInfo)

		const closeSignature = await closeAccount(
			connection,
			payer,
			mintKeypair.publicKey,
			payer.publicKey,
			payer,
			[],
			{commitment: 'finalized'},
			TOKEN_2022_PROGRAM_ID
		)
		console.log(
			`Check the transaction at: https://explorer.solana.com/tx/${closeSignature}?cluster=${CLUSTER}`
		)
	} catch (e) {
		console.log(e);
	}

}

main()
