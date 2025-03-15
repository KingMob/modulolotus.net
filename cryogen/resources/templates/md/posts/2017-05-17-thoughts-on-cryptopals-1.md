{:title "Using Clojure for the Cryptopals cryptography challenges"
 :slug "clojure-crypto-pals-1"
 :layout :post
 :tags  ["clojure" "cryptopals" "matasano" "cryptography"]}

I've been going through the [Cryptopals challenges](https://cryptopals.com/) recently. For those who don't know, they're a series of exercises based on real-life cryptography breaks, and they're lots of fun. You can see my code [here](https://github.com/KingMob/cryptopals-crypto-challenges).

Clojure is one of my favorite languages, so I decided to tackle them with it. Here are some thoughts on the first 3 sets, plus a few issues I ran into along the way. I hope this helps anyone else going through them without giving too much away.


## General challenge notes
### Challenge 3 - Single-byte XOR cipher
When doing frequency analysis, the instructions make no mention of the chi-squared statistic, though that's probably a good starting point, and generalizes beyond alphabetic frequencies to any expected distribution. You can use it later when detecting ECB vs CBC, since you can use it to detect deviations from uniformity.

### Challenge 7 - AES in ECB mode
The instructions *do* mention this, but after chatting with someone else doing the challenges, realize that you do *not* need to write AES yourself. Just use a default implementation for your language. You only need the single block transform (ECB), which you'll use to build on top of. For Java, all you need is javax.crypto.Cipher and SecretKeySpec, using "AES/ECB/NoPadding".

### Challenge 9 - Implement PKCS#7 padding
When implementing PKCS#7 padding, the instructions make no mention of what to do when your data lines up perfectly on a block boundary. Only later, when doing the padding oracle challenge, did I realize you have to add an entire padding block (sixteen 16's) in that case.

### Challenge 17 - The CBC padding oracle
When altering the first byte of a block to see if it produces valid padding, you're aiming to alter it such that the padding ends in a single 1 byte. But *remember*, if you test the *original, unaltered* byte, you will *also* get valid PKCS#7 padding (since it was correct to begin with), which is probably not 1.

### Challenge 18 - Implement CTR, the stream cipher mode
Look carefully at the examples. At first glance it looks as if you're XORing a bunch of zeros, but the ninth byte is actually incrementing.

### Challenge 23 - Clone an MT19937 RNG from its output
Inverting the [Mersenne Twister](https://en.wikipedia.org/wiki/Mersenne_Twister)'s temper function has a computationally simple version. It's not necessary to use brute force, inverse matrix multiplication, or a constraint solver. It can be done with just bit operations. The key insight is that XORing an integer with a shifted version of itself results in many of the bits in the output being identical (since the shifted-in bits are 0). You can then shift *those* bits and XOR again to obtain *more* bits, repeating until you have the whole thing.

## Clojure / Java-specific issues
### Poor primitive support in JVM and Clojure

The bread and butter of cryptography is byte-level manipulation. Unfortunately, the JVM treats bytes as second-class citizens (e.g., many methods on Integer/Long have no Byte counterpart), and lacks support for unsigned integer types. On top of this, Clojure defaults to 64-bit longs everywhere, necessitating a lot of conversion. I ended up writing many conversion routines just for basic support, and leaving integers in the default long type for compatibility.

The single biggest thing to watch for was when I got deep into bit-shifting code while building the [Mersenne Twister](https://en.wikipedia.org/wiki/Mersenne_Twister) random number generator. When everything is a long, unsigned right bit shifts **will not do what you expect**. The 32-bit version of the Mersenne Twister (MT) relies on unsigned 32-bit ints. But unsigned shifting adds zeros at the end, which, if you're using a larger data type, will result in the zeros entering *above* the bits of interest. E.g., consider the case where all bits are set to 1 (in two's complement, this is -1), and you do an unsigned shift right by 16 bits. You *want*:

`00000000000000001111111111111111`

but you *get*:

`0000000000000000111111111111111111111111111111111111111111111111`

Since you only want the right-most 32 bits, it appears as if shifting had no effect!


## Final Thoughts

1. Some of these ciphers are so broken, I'm amazed they were ever used. Apparently, the simple substitution cipher (replace each letter with the letter *n* higher) was in use as late as 1915 by the Russian army, despite frequency analysis having been described a millennia (!) earlier.

2. Almost everything decrypts to Vanilla Ice lyrics. Unfortunately, there's probably nothing hidden in *them*.
