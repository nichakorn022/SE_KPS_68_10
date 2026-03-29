import { useEffect, useState } from "react";
import { apiUrl, assetUrl } from "../../lib/api";
import {
  getStoredToken,
  getUserIdFromToken,
  getUserRoleFromToken,
} from "../Shop/authClient";

const api = {
  getShops: () =>
    fetch(apiUrl("/shops")).then((response) => {
      if (!response.ok) throw new Error(`Shops ${response.status}`);
      return response.json();
    }),
  getProducts: () =>
    fetch(apiUrl("/products")).then((response) => {
      if (!response.ok) throw new Error(`Products ${response.status}`);
      return response.json();
    }),
  getProductImages: () =>
    fetch(apiUrl("/product-images")).then((response) => {
      if (!response.ok) throw new Error(`Product images ${response.status}`);
      return response.json();
    }),
  getShopImages: () =>
    fetch(apiUrl("/shop-images")).then((response) => {
      if (!response.ok) throw new Error(`Shop images ${response.status}`);
      return response.json();
    }),
};

function getLocation(shop) {
  return [shop?.subdistrict, shop?.district, shop?.province]
    .filter(Boolean)
    .join(", ");
}

function createProductImageMap(rows) {
  const map = new Map();

  for (const image of Array.isArray(rows) ? rows : []) {
    const productId = Number(image.product_id);
    if (!map.has(productId) && image.image_path) {
      map.set(productId, assetUrl(image.image_path));
    }
  }

  return map;
}

export default function useSellerWorkspace() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);

  const userId = getUserIdFromToken();
  const role = getUserRoleFromToken();

  useEffect(() => {
    let ignore = false;

    if (!getStoredToken()) {
      setError("Please log in before opening Seller Hub");
      setShop(null);
      setProducts([]);
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    if (role !== "shop") {
      setError("This workspace is available only for shop accounts");
      setShop(null);
      setProducts([]);
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    setLoading(true);
    setError("");

    Promise.all([
      api.getShops(),
      api.getProducts(),
      api.getProductImages().catch(() => []),
      api.getShopImages().catch(() => []),
    ])
      .then(([shopRows, productRows, productImageRows, imageRows]) => {
        if (ignore) return;

        const productImageMap = createProductImageMap(productImageRows);

        const ownedShop = (Array.isArray(shopRows) ? shopRows : []).find(
          (item) => Number(item.user_id) === Number(userId)
        );

        if (!ownedShop) {
          setError("No shop profile found for this account");
          setShop(null);
          setProducts([]);
          setLoading(false);
          return;
        }

        const coverImage =
          (Array.isArray(imageRows) ? imageRows : []).find(
            (item) => Number(item.shop_id) === Number(ownedShop.shop_id)
          )?.image_path || null;

        const ownProducts = (Array.isArray(productRows) ? productRows : [])
          .filter((item) => Number(item.shop_id) === Number(ownedShop.shop_id))
          .map((item) => ({
            id: Number(item.product_id),
            name: item.tea_name,
            type: item.tea_type,
            price: Number(item.price || 0),
            stock: Number(item.stock || 0),
            sales7d: Number(item.sales_7d || 0),
            avgRating: Number(item.avg_rating || 0),
            reviewCount: Number(item.review_count || 0),
            img: productImageMap.get(Number(item.product_id)) || null,
          }));

        setShop({
          id: Number(ownedShop.shop_id),
          name: ownedShop.shop_name,
          description: ownedShop.description || "",
          phone: ownedShop.phone || "-",
          contactInfo: ownedShop.contact_info || "",
          location: getLocation(ownedShop),
          address: ownedShop.address || "-",
          verified: Number(ownedShop.verified_status) === 1,
          image: coverImage ? assetUrl(coverImage) : null,
        });
        setProducts(ownProducts);
      })
      .catch((fetchError) => {
        if (!ignore) {
          setError(fetchError.message || "Failed to load seller workspace");
          setShop(null);
          setProducts([]);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [role, userId]);

  return {
    loading,
    error,
    shop,
    products,
  };
}

