import { useEffect, useState } from 'react';
import { Autocomplete } from '@mantine/core';
import { api } from '../api/client';

const FALLBACK_BRANDS = ['Regasco', 'Seagas', 'Pryce'];

export default function BrandAutocomplete({
  value,
  onChange,
  label = 'Brand',
  required = false,
  placeholder = 'Select or type a brand',
  id,
}) {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    api
      .getBrands()
      .then((res) => {
        const fetchedBrands = Array.isArray(res.data)
          ? res.data
          : [];

        setBrands(
          fetchedBrands.length > 0
            ? fetchedBrands
            : FALLBACK_BRANDS
        );
      })
      .catch(() => {
        setBrands(FALLBACK_BRANDS);
      });
  }, []);

  return (
    <Autocomplete
      id={id}
      label={label}
      placeholder={placeholder}
      data={brands}
      value={value}
      onChange={onChange}
      withAsterisk={required}
      comboboxProps={{
        withinPortal: true,
        zIndex: 1000,
      }}
    />
  );
}