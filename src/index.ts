import {initializeKeypair} from '@solana-developers/helpers'
import {
	Cluster,
	Connection,
	clusterApiUrl,
	Keypair,
	LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import {createClosableMint} from './create-mint'
import {
	TOKEN_2022_PROGRAM_ID,
	burn,
	closeAccount,
	createAccount,
	getAccount,
	getMint,
	mintTo,
} from '@solana/spl-token'
import printTableData from './print-helpers'
import dotenv from 'dotenv'
dotenv.config()

const CLUSTER: Cluster = 'devnet'

async function main() {
	/**
	 * Create a connection and initialize a keypair if one doesn't already exists.
	 * If a keypair exists, airdrop a sol if needed.
	 */
	const connection = new Connection(clusterApiUrl(CLUSTER))
	const payer = await initializeKeypair(connection)

	console.log(`public key: ${payer.publicKey.toBase58()}`)

	const mintKeypair = Keypair.generate()
	const mint = mintKeypair.publicKey
	console.log(
		'\nmint public key: ' + mintKeypair.publicKey.toBase58() + '\n\n'
	)

	/**
	 * Creating a mint with close authority
	 */
	const decimals = 9

	await createClosableMint(CLUSTER, connection, payer, mintKeypair, decimals)

	/**
	 * Creating an account and mint 1 token to that account
	 */
	console.log('Creating an account...')
	const sourceKeypair = Keypair.generate()
	const sourceAccount = await await createAccount(
		connection,
		payer,
		mint,
		sourceKeypair.publicKey,
		undefined,
		{commitment: 'finalized'},
		TOKEN_2022_PROGRAM_ID
	)

	console.log('Minting 1 token...\n\n')
	const amount = 1 * LAMPORTS_PER_SOL
	await mintTo(
		connection,
		payer,
		mint,
		sourceAccount,
		payer,
		amount,
		[payer],
		{commitment: 'finalized'},
		TOKEN_2022_PROGRAM_ID
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
	try {
		await closeAccount(
			connection,
			payer,
			mintKeypair.publicKey,
			payer.publicKey,
			payer,
			[],
			{commitment: 'finalized'},
			TOKEN_2022_PROGRAM_ID
		)
	} catch (e) {
		console.log(
			'Close account fails here because the supply is not zero. Check the program logs:',
			(e as any).logs,
			'\n\n'
		)
	}

	const sourceAccountInfo = await getAccount(
		connection,
		sourceAccount,
		'finalized',
		TOKEN_2022_PROGRAM_ID
	)

	console.log('Burning the supply...')
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
		`Check the transaction at: https://explorer.solana.com/tx/${burnSignature}?cluster=${CLUSTER} \n\n`
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

		console.log('Closing after burning the supply...')
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
			`Check the transaction at: https://explorer.solana.com/tx/${closeSignature}?cluster=${CLUSTER} \n\n`
		)
	} catch (e) {
		console.log(e)
	}
}

main()
