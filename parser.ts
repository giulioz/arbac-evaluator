export type PathToken =
  | { type: "negation"; child: PathToken }
  | { type: "literal"; id: string }
  | { type: "TRUE" }
  | { type: "FALSE" };

function parsePathToken(token: string): PathToken {
  if (token === "TRUE") {
    return { type: "TRUE" };
  } else if (token === "FALSE") {
    return { type: "FALSE" };
  } else if (token.startsWith("-")) {
    return { type: "negation", child: parsePathToken(token.substr(1)) };
  } else {
    return { type: "literal", id: token };
  }
}

export type Policy = {
  roles: string[];
  users: string[];
  ua: { userA: string; roleB: string }[];
  cr: { roleA: string; roleB: string }[];
  ca: { roleA: string; path: PathToken[]; roleT: string }[];
  goal: string;
};

export default function parsePolicy(data: string): Policy {
  const policy: Policy = {
    roles: [],
    users: [],
    ua: [],
    cr: [],
    ca: [],
    goal: "",
  };

  const lines = data.split("\n").filter((l) => l.trim().length > 0);

  lines.forEach((line) => {
    if (line.startsWith("Roles")) {
      policy.roles = line.trim().split(" ").slice(1, -1);
    } else if (line.startsWith("Users")) {
      policy.users = line.trim().split(" ").slice(1, -1);
    } else if (line.startsWith("UA")) {
      policy.ua = line
        .trim()
        .split(" ")
        .slice(1, -1)
        .filter((t) => t.length > 0)
        .map((uae) => {
          const [fst, snd] = uae.split(",");
          return { userA: fst.substr(1), roleB: snd.substr(0, snd.length - 1) };
        });
    } else if (line.startsWith("CR")) {
      policy.cr = line
        .trim()
        .split(" ")
        .slice(1, -1)
        .filter((t) => t.length > 0)
        .map((uae) => {
          const [fst, snd] = uae.split(",");
          return { roleA: fst.substr(1), roleB: snd.substr(0, snd.length - 1) };
        });
    } else if (line.startsWith("CA")) {
      policy.ca = line
        .trim()
        .split(" ")
        .slice(1, -1)
        .map((uae) => {
          const [fst, mid, snd] = uae.split(",");
          return {
            roleA: fst.substr(1),
            path: mid.split("&").map(parsePathToken),
            roleT: snd.substr(0, snd.length - 1),
          };
        });
    } else if (line.startsWith("Goal")) {
      policy.goal = line.trim().split(" ")[1];
    }
  });

  return policy;
}
