import { Policy } from "./parser";

// Represents a map with user-roles associations
type RolesSet = { [key: string]: string[] };

// Build initial roles set
function buildInitialRoles(policy: Policy): RolesSet {
  const rolesForUsers = {};

  policy.users.forEach(user =>
    policy.userRoles.forEach(role => {
      if (role.user === user) {
        rolesForUsers[user] = [...(rolesForUsers[user] || []), role.role];
      }
    })
  );

  return rolesForUsers;
}

// Apply a role assign operation, returning true if it was successful
function applyAssign(rolesSet: RolesSet, user: string, role: string) {
  const result: RolesSet = { ...rolesSet };

  let done = false;

  Object.keys(rolesSet).forEach(u => {
    if (user === u) {
      const added = Array.from(new Set([...rolesSet[u], role]));
      if (added.length > result[u].length) {
        result[u] = added;
        done = true;
      }
    }
  });

  if (done) {
    return result;
  } else {
    return null;
  }
}

// Apply a role revocation operation, returning true if it was successful
function applyRevocation(rolesSet: RolesSet, user: string, role: string) {
  const result: RolesSet = { ...rolesSet };

  let found = false;

  Object.keys(rolesSet).forEach(u => {
    if (user === u) {
      const removed = rolesSet[u].filter(r => r !== role);
      if (removed.length < result[u].length) {
        result[u] = removed;
        found = true;
      }
    }
  });

  if (found) {
    return result;
  } else {
    return null;
  }
}

// Find if there exists an user with a given role in a role set
function findUsersWithRole(rolesSet: RolesSet, role: string) {
  return Object.keys(rolesSet).filter(
    user => rolesSet[user] && rolesSet[user].find(r => r === role)
  );
}

// Compare two string array equality
function compareStrArrays(array1: string[], array2: string[]) {
  array1.sort();
  array2.sort();
  for (var i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) return false;
  }
  return true;
}

// Check if two roles set are equals
function rolesEqual(a: RolesSet, b: RolesSet) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  const sameKeys = keysA.every(keyA => keysB.findIndex(k => k === keyA) !== -1);

  if (!sameKeys) {
    return false;
  }

  return keysA.every(key => compareStrArrays(a[key], b[key]));
}

// Join two roles set arrays
function joinSteps(tried: RolesSet[]): RolesSet[] {
  const out: RolesSet[] = [];
  tried.forEach(t => {
    if (!out.find(r => rolesEqual(t, r))) {
      out.push(t);
    }
  });

  return out;
}

// Try all the possible combinations
function bruteForce(initialRoles: RolesSet, policy: Policy) {
  // All the tried combinations
  let tried: RolesSet[] = [initialRoles];

  let found = false;

  while (!found) {
    const newTries: RolesSet[] = [];

    tried.forEach(rolesSet => {
      // add all assign steps
      policy.canAssign.forEach(assign => {
        const admins = findUsersWithRole(rolesSet, assign.roleAdmin);

        // if there is an admin, we may apply the assign
        if (admins.length > 0) {
          Object.keys(rolesSet).forEach(user => {
            const targetUserRoles = rolesSet[user];

            // check for positive conditions
            const positiveConditionsCheck = assign.positiveConditions.every(
              condRule => targetUserRoles.find(role => role === condRule)
            );

            // check for negative conditions
            const negativeConditionsCheck = assign.negativeConditions.some(
              condRule => targetUserRoles.find(role => role === condRule)
            );

            // try applying the assign
            const withAssign = applyAssign(rolesSet, user, assign.roleToAssign);

            if (
              withAssign &&
              positiveConditionsCheck &&
              !negativeConditionsCheck
            ) {
              newTries.push(withAssign);
            }
          });
        }
      });

      // add all revocation steps
      policy.canRevoke.forEach(revoke => {
        const admins = findUsersWithRole(rolesSet, revoke.roleAdmin);

        // if there is an admin, we may apply the revocation
        if (admins.length > 0) {
          Object.keys(rolesSet).forEach(user => {
            // try applying the revocation
            const withRevocation = applyRevocation(
              rolesSet,
              user,
              revoke.roleToRevoke
            );

            // check that at least one user has a role
            const hasEmptyUsers =
              withRevocation &&
              Object.keys(withRevocation).every(
                key => withRevocation[key].length === 0
              );

            if (withRevocation && !hasEmptyUsers) {
              newTries.push(withRevocation);
            }
          });
        }
      });
    });

    // Check for exit condition
    const hasReachedTargetState = newTries.find(rolesSet =>
      Object.keys(rolesSet).find(user => {
        const userRoles = rolesSet[user];
        return userRoles && userRoles.find(role => role === policy.goal);
      })
    );

    if (hasReachedTargetState) {
      found = true;
    }

    // Updated the tries so far
    tried = joinSteps([...tried, ...newTries]);
  }

  return found;
}

export default function isReachable(policy: Policy) {
  const initialRoles = buildInitialRoles(policy);

  return bruteForce(initialRoles, policy);
}
