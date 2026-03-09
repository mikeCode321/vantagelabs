import Image from "next/image";
import React from "react";

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  date_created?: string;
}


export default async function Test() {

  const res = await fetch("http://backend:8000/api/contacts/", {
    cache: "no-store", 
  });

  console.log("Status:", res.status, res.statusText);


  if (!res.ok) {
    throw new Error("Failed to fetch contacts");
  }

  const contacts: Contact[] = await res.json();
  console.log("Contacts data:", contacts);

  
  return (
    <div>
      <h1>All Contacts</h1>
      <ul>
        {contacts.map((contact) => (
          <li key={contact.id}>
            {contact.first_name} {contact.last_name} - {contact.email}
          </li>
        ))}
      </ul>
    </div>
  );
}