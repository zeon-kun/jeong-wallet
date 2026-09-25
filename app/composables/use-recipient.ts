import { getAddress, isAddress, type Address } from "viem";

/** Recipient input validation: format, EIP-55 checksum, and whether it's one of our accounts. */
export function useRecipient(input: Ref<string>) {
  const smart = useSmartAccounts();

  return computed(() => {
    const raw = input.value.trim();
    if (!raw) return { state: "empty" as const };
    if (!isHexAddress(raw))
      return { state: "invalid" as const, message: "Not an address (0x + 40 hex characters)." };
    // Mixed case means the sender claims a checksum: it must be correct.
    if (!isAddress(raw, { strict: true }))
      return {
        state: "invalid" as const,
        message: "Checksum doesn't match. A character may be mistyped.",
      };
    const address = getAddress(raw) as Address;
    const own = smart.findByAddress(address);
    if (own && own.index === smart.active.value?.index)
      return {
        state: "self" as const,
        address,
        own,
        message: "That's the account you're sending from.",
      };
    return {
      state: "valid" as const,
      address,
      own,
      message: own
        ? `Valid address · your account “${own.label}”`
        : "Valid address · new recipient",
    };
  });
}
