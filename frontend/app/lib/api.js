// // const API_BASE_URL =
// //   process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// // export async function apiFetch(endpoint, options = {}) {
// //   return fetch(`${API_BASE_URL}${endpoint}`, {
// //     ...options,
// //     credentials: "include",
// //     headers: {
// //       ...(options.headers || {}),
// //     },
// //   });
// // }

// const API_BASE_URL =
//   process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// export async function apiFetch(endpoint, options = {}) {
//   const isAbsoluteUrl = /^https?:\/\//i.test(endpoint);

//   const url = isAbsoluteUrl
//     ? endpoint
//     : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

//   return fetch(url, {
//     ...options,
//     credentials: "include",
//     headers: {
//       ...(options.headers || {}),
//     },
//   });
// }

const API_BASE_URL = "/api";

export async function apiFetch(endpoint, options = {}) {
  const isAbsoluteUrl = /^https?:\/\//i.test(endpoint);

  const url = isAbsoluteUrl
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });
}