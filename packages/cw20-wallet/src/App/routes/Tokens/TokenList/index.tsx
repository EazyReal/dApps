import { nativeCoinToDisplay } from "@cosmicdapp/logic";
import { Coin } from "@cosmjs/launchpad";
import { Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { config } from "../../../../config";
import { pathTokenDetail } from "../../../paths";
import { useContracts } from "../../../service/contracts";
import { CW20Instance } from "../../../service/cw20";
import { BorderContainer, TokenItem, TokenStack } from "./style";

const { Text } = Typography;

interface TokenWithAddress {
  readonly token: Coin;
  readonly address: string;
}

async function getCoin(contract: CW20Instance): Promise<Coin> {
  const denom = (await contract.tokenInfo()).symbol;
  const amount = await contract.balance();

  return { denom, amount };
}

function TokenList(): JSX.Element {
  const history = useHistory();
  const { contracts } = useContracts();

  const [tokens, setTokens] = useState<readonly TokenWithAddress[]>([]);

  useEffect(() => {
    setTokens([]);
    contracts.forEach((contract) =>
      getCoin(contract).then((token) =>
        setTokens((tokens) => [...tokens, { token, address: contract.contractAddress }]),
      ),
    );
  }, [contracts]);

  function goTokenDetail(tokenAddress: string) {
    history.push(`${pathTokenDetail}/${tokenAddress}`);
  }

  return (
    <TokenStack>
      {tokens.map((token) => {
        const { denom: denomToDisplay, amount: amountToDisplay } = nativeCoinToDisplay(
          token.token,
          config.coinMap,
        );

        return (
          <TokenItem key={token.token.denom} onClick={() => goTokenDetail(token.address)}>
            <BorderContainer>
              <Text>{denomToDisplay}</Text>
              <Text>{amountToDisplay !== "0" ? amountToDisplay : "No tokens"}</Text>
            </BorderContainer>
          </TokenItem>
        );
      })}
    </TokenStack>
  );
}

export default TokenList;
